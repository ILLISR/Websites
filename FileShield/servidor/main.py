from enum import Enum
import aiohttp
import hashlib
from mimetypes import guess_type
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from config import ApplicationConfig
from models import Base, FileAnalysis, SearchHistory, User
from typing import Optional
from sqlalchemy.future import select
import logging

# Configurar el registro
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Configurar la base de datos
DATABASE_URL = ApplicationConfig.SQLALCHEMY_DATABASE_URI.replace('postgresql://', 'postgresql+asyncpg://')
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Middleware para CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajustar según sea necesario
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear las tablas
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("startup")
async def on_startup():
    await init_db()

# Dependencia para obtener la sesión de la base de datos
async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session

# Dependencia para obtener el usuario opcionalmente
async def get_optional_user(user_id: Optional[int] = Header(None), session: AsyncSession = Depends(get_session)) -> Optional[User]:
    if user_id is None:
        logging.info("ID de usuario no proporcionado")
        return None
    
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user:
        logging.info(f"Usuario encontrado: {user.id} - {user.email}")
    else:
        logging.info("Usuario noss encontrado en la base de datos")
    return user

# Función para calcular los hashes del archivo en memoria
def calculate_hashes(file_content):
    md5 = hashlib.md5()
    sha1 = hashlib.sha1()
    sha256 = hashlib.sha256()

    md5.update(file_content)
    sha1.update(file_content)
    sha256.update(file_content)

    return {
        "md5": md5.hexdigest(),
        "sha1": sha1.hexdigest(),
        "sha256": sha256.hexdigest()
    }

# Función para escanear archivo
async def scan_file(file_content, file_name):
    try:
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            data = aiohttp.FormData()
            data.add_field('apikey', '5bad70b6034f2760ffcdcee74e251f4b6fbb82565054479a407aa42d8ef7bdc3')
            data.add_field('file', file_content, filename=file_name, content_type='application/octet-stream')

            async with session.post('https://www.virustotal.com/vtapi/v2/file/scan', data=data) as response:
                if response.status == 413:
                    raise HTTPException(status_code=413, detail="El archivo es demasiado grande para ser analizado")
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="Error al enviar el archivo para análisis")

                result = await response.json()
                id = result.get('sha256') or result.get('sha1') or result.get('md5')
                if not id:
                    raise HTTPException(status_code=500, detail="Error: el hash no está presente en la respuesta de la API")

            headers = {'x-apikey': '5bad70b6034f2760ffcdcee74e251f4b6fbb82565054479a407aa42d8ef7bdc3'}
            async with session.get(f'https://www.virustotal.com/api/v3/files/{id}', headers=headers) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status, detail="Error al obtener el reporte del archivo")

                report = await response.json()
                last_analysis_result = report.get('data', {}).get('attributes', {}).get('last_analysis_results', {})
                sandbox_verdicts = report.get('data', {}).get('attributes', {}).get('sandbox_verdicts', {})
                names = report.get('data', {}).get('attributes', {}).get('names', [])

                result = {
                    'last_analysis_result': last_analysis_result,
                    'sandbox_verdicts': sandbox_verdicts,
                    'names': names
                }

                file_type, _ = guess_type(file_name)
                if file_type is None:
                    file_type = "Unknown"

                return result, file_type
    except aiohttp.ClientOSError as e:
        logging.error(f"Error de red: {e}")
        raise HTTPException(status_code=500, detail="Error de red")
    except Exception as e:
        logging.error(f"Error al escanear el archivo: {e}")
        raise HTTPException(status_code=500, detail="Error al escanear el archivo")

@app.post("/upload")
async def upload_file(files: list[UploadFile] = File(...), session: AsyncSession = Depends(get_session), current_user: Optional[User] = Depends(get_optional_user)):
    if not files:
        raise HTTPException(status_code=400, detail="Archivos no seleccionados")

    analysis_results = []

    max_file_size = 128 * 1024 * 1024  # 32 MB

    for file in files:
        content = await file.read()

        if len(content) > max_file_size:
            raise HTTPException(status_code=413, detail="El archivo es demasiado grande para ser analizado")

        hashes = calculate_hashes(content)
        hash_type, hash_value = 'sha256', hashes['sha256']

        file_analysis = await session.execute(select(FileAnalysis).where(FileAnalysis.hash_value == hash_value))
        file_analysis_record = file_analysis.scalars().first()

        if file_analysis_record:
            result = {
                'name': file.filename,
                'hash_type': file_analysis_record.hash_type.value,
                'hash_value': file_analysis_record.hash_value,
                'last_analysis_result': file_analysis_record.analysis_result.get('last_analysis_result', {}),
                'sandbox_verdicts': file_analysis_record.analysis_result.get('sandbox_verdicts', {}),
                'names': file_analysis_record.analysis_result.get('names', [])
            }
            file_type = file_analysis_record.file_type
        else:
            try:
                analysis, file_type = await scan_file(content, file.filename)
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

            result = {
                'name': file.filename,
                'hash_type': hash_type,
                'hash_value': hash_value,
                'last_analysis_result': analysis.get('last_analysis_result', {}),
                'sandbox_verdicts': analysis.get('sandbox_verdicts', {}),
                'names': analysis.get('names', [])
            }
            file_analysis_record = FileAnalysis(
                hash_type=hash_type,
                hash_value=hash_value,
                file_type=file_type,
                analysis_result=result
            )
            session.add(file_analysis_record)
            await session.commit()

        analysis_results.append(result)

        if current_user:
            # Guardar en el historial de búsqueda
            search_history = SearchHistory(
                user_id=current_user.id,
                file_analysis_id=file_analysis_record.id
            )
            session.add(search_history)
            await session.commit()

    return JSONResponse(content=analysis_results)


@app.get("/historial")
async def get_historial(session: AsyncSession = Depends(get_session), current_user: Optional[User] = Depends(get_optional_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        result = await session.execute(select(SearchHistory).where(SearchHistory.user_id == current_user.id))
        search_histories = result.scalars().all()
        
        search_histories_list = []
        for sh in search_histories:
            file_analysis_result = await session.execute(select(FileAnalysis).where(FileAnalysis.id == sh.file_analysis_id))
            file_analysis = file_analysis_result.scalars().first()
            if file_analysis:
                search_histories_list.append({
                    "hash_type": file_analysis.hash_type.value,
                    "hash_value": file_analysis.hash_value,
                    "createdAt": sh.createdAt.isoformat(),  # Convertir a cadena ISO 8601
                    "file_type": file_analysis.file_type,
                    "analysis_result": file_analysis.analysis_result
                })
        
        return JSONResponse(content=search_histories_list)
    except Exception as e:
        logging.error(f"Error fetching search histories: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
