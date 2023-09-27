import numpy as np
from numpy.random import default_rng
import matplotlib.pyplot as plt
import random
import itertools as iter

def SEL(y, yhat):
    return (yhat - y)**2

class Least_Square():
    def __init__(self):
        self.params = None
    def fit(self, X, Y):
        if len(X) != len(Y):
            raise ValueError("X and Y must have the same length.")
        #y = mx + c = Ap, where A = [[x, 1]] and p = [[m], [c]]
        A = np.vstack([X, np.ones(len(X))]).T
        self.m, self.c = np.linalg.lstsq(A, Y, rcond=None)[0]
        #return the model object
        return self
    
    def predict(self, X: np.array):
        prediction =  X * self.m + self.c
        return prediction
    
class RANSAC():
    def __init__(self,  model, loss_fun, n = 5, k = 500, t = None):
        '''This is the constructor for the ransac object.

        Attribute
        ------------
        model: model object implementing fit and predict
        loss: a loss function to assert model fit
        n : Minimum number of data points to estimate the parameters
        k : maximum iterations allowed
        t : threshold value to determine if point are fit well, if not provided will automatically use percentile
        percentile: percentile of error if want to use value other than 95
        '''

        self.model = model
        self.loss_fun = loss_fun
        self.n = n
        self.t = t
        self.k = k
        self.bestFit = None
        self.x_inliers = []
        self.y_inliers = []
        self.z_inliers = []
        self.mostInlnliers = 0

    #line fit
    def fit(self, X, Y):
        for i in range(self.k):
            if len(X) == self.n:
                self.bestFit = self.model.fit(X, Y)
                self.x_inliers = X
                self.y_inliers = Y
                self.mostInlnliers = len(X)
                break
            rng = default_rng()
            randomIDs = rng.choice(len(X), self.n, replace=False)
            #sampling random points
            maybeInliersX = X[randomIDs]
            maybeInliersY = Y[randomIDs]

            #fit model
            maybeModel = self.model.fit(maybeInliersX, maybeInliersY)

            #fit remaining points to model
            yhat = maybeModel.predict(X) 
            loss = self.loss_fun(Y, yhat)
            
            #Choose threshold if t is not provided then use 1 mad (median average deviation) as threshold
            #median is better when dealing with outlier than mean
            if self.t ==  None:
                threshold = np.sum(np.abs(loss - np.mean(loss))) / len(loss)
                #threshold = np.mean(loss) + 2*np.std(loss)
            else:
                threshold = self.t

            #get the inliers
            inliersX = np.asarray([X[e] for e in range(len(loss)) if loss[e] < threshold])
            inliersY = np.asarray([Y[e] for e in range(len(loss)) if loss[e] < threshold])

            #check if have sufficient inliers
            if len(inliersX) > self.mostInlnliers and len(inliersX) >= self.n:
                #store the inliers
                self.x_inliers = inliersX #inliers
                self.y_inliers = inliersY #inliers
                self.mostInlnliers = len(inliersX)
            #store model
            self.bestFit = self.model.fit(self.x_inliers, self.y_inliers) 
                         
        return self
    
    
    
    