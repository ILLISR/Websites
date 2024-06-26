import csv
import requests
import json
import argparse
import os
import sys
import asyncio
import signal
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Base, FileAnalysis, HashType
from config import ApplicationConfig
from sqlalchemy.future import select

# Configurar la base de datos
DATABASE_URL = ApplicationConfig.SQLALCHEMY_DATABASE_URI.replace('postgresql://', 'postgresql+asyncpg://')
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Variable global para indicar si el programa debe detenerse
stop_program = False

def signal_handler(sig, frame):
    global stop_program
    print("Parando el programa....")
    stop_program = True

async def read_file_and_process_csv(file_path, max_calls_per_day):
    async with async_session() as session:
        # Leer el archivo de estado
        state = load_state()
        calls_made = state.get('calls_made', 0)
        last_call_date_str = state.get('last_call_date', datetime.min.isoformat())
        last_call_date = datetime.fromisoformat(last_call_date_str)
        remaining_lines = state.get('remaining_lines', [])

        # Verificar si la fecha de la última llamada es diferente a hoy
        if last_call_date.date() != datetime.now().date():
            calls_made = 0  # Resetear el contador diario

        if not remaining_lines:
            with open(file_path, 'r') as file:
                reader = csv.DictReader(file)
                remaining_lines = list(reader)

        new_remaining_lines = []
        batch_size = 15  # Número de llamadas por minuto

        for line in remaining_lines:
            if stop_program or calls_made >= max_calls_per_day:
                print("Parando el programa o se ha alcanzado el numero maximo de llamadas.")
                new_remaining_lines.append(line)
                break

            sha256 = line['sha256_hash'].strip()
            # Saltar líneas vacías y comentarios
            if sha256:
                if not await is_hash_in_db(session, sha256):
                    await store_in_db(session, sha256, line)
                    calls_made += 1
                    batch_size -= 1
                else:
                    print(f"Hash {sha256} ya se encuentra en la base de datos saltando....")
            else:
                new_remaining_lines.append(line)  # Mantener comentarios y líneas vacías

            if batch_size == 0:
                print(f"Esperando 60 segundos para evitar el limite...")
                await asyncio.sleep(60)  # Pausar por 60 segundos
                batch_size = 30  # Resetear el tamaño del lote

        # Guardar el estado
        save_state({
            'calls_made': calls_made,
            'last_call_date': datetime.now().isoformat(),
            'remaining_lines': new_remaining_lines
        })
        
        print(f"Llamadas totales hechas: {calls_made}")

async def is_hash_in_db(session, sha256):
    result = await session.execute(select(FileAnalysis).where(FileAnalysis.hash_value == sha256))
    return result.scalars().first() is not None

async def store_in_db(session, sha256, data):
    file_type = data.get('file_type_guess', "Unknown")
    analysis_result = {
        'last_analysis_result': {
            'reporter': data.get('reporter'),
            'file_name': data.get('file_name'),
            'file_type_guess': data.get('file_type_guess'),
            'mime_type': data.get('mime_type'),
            'signature': data.get('signature'),
            'clamav': data.get('clamav'),
            'vtpercent': data.get('vtpercent'),
            'imphash': data.get('imphash'),
            'ssdeep': data.get('ssdeep'),
            'tlsh': data.get('tlsh')
        },
        'sandbox_verdicts': {},
        'names': [data.get('file_name')]
    }
    file_analysis = FileAnalysis(
        hash_type=HashType.sha256,
        hash_value=sha256,
        file_type=file_type,
        analysis_result=analysis_result
    )
    session.add(file_analysis)
    await session.commit()
    print(f"Datos del hash {sha256} guardados en la base de datos.")

def load_state():
    state_file = 'state.json'
    if os.path.exists(state_file):
        with open(state_file, 'r') as f:
            import json
            return json.load(f)
    return {}

def save_state(state):
    state_file = 'state.json'
    with open(state_file, 'w') as f:
        import json
        json.dump(state, f, default=str)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lee los hashes del fichero CSV y los guarda en la base de datos.")
    parser.add_argument("file_path", help="Ruta del fichero CSV que contiene los hashes")
    parser.add_argument("--max-calls", type=int, default=500, help="Numero de llamadas maximo")

    args = parser.parse_args()

    # Configurar el manejador de señales
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Ejecutar el script con asyncio
    try:
        asyncio.run(read_file_and_process_csv(args.file_path, args.max_calls))
    except asyncio.CancelledError:
        print("Program was cancelled.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        print("Program has stopped.")
