from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from api.ransac import RANSAC, Least_Square, SEL
import json


class Data(BaseModel):
    threshold: float | None = None
    numIter: int | None = None
    x: list[float]
    y: list[float]

class ReactData(BaseModel):
    x: list[float]
    y: list[float]

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5501",  # Replace this with the origin of your web page
    # Add other allowed origins as needed
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

def create_plot(x, y, thres, iter = None):
    if thres == None:
        ransac_ = RANSAC(model = Least_Square(), loss_fun = SEL, n = 2, k = iter)
    else:
        ransac_ = RANSAC(model = Least_Square(), loss_fun = SEL, n = 2, k = iter, t = thres)
    model = ransac_.fit(x, y)
    #y_hat = model.bestFit.predict(x)
    return model.bestFit #nparray

@app.post("/ransac/post")
async def path_fun(data: Data):
    x = np.asarray(data.x)
    y = np.asarray(data.y)  
    model = create_plot(x, y, iter = data.numIter, thres=data.threshold)
    y_ransac = model.predict(x)
    lm = Least_Square()
    lm.fit(x, y)
    y_lsq = lm.predict(x)
    return {"y_ransac": y_ransac.tolist(), 
            "y_lsq": y_lsq.tolist(), 
            "slope": model.m, 
            "intercept": model.c}

