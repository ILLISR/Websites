from pydantic import BaseModel
from typing import List, Optional

class AnalysisResult(BaseModel):
    last_analysis_result: Optional[dict]
    sandbox_verdicts: Optional[dict]
    names: List[str]

class UserCreate(BaseModel):
    email: str
    name: Optional[str]
    image: Optional[str]
