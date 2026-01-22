import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn import preprocessing
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import r2_score


def calculate(*inputs):

    data = pd.read_csv('data/Tech_Use_Stress_Wellness.csv', sep=';')
    data.head()

    X = data.iloc[:,0:-3].values
    y = data.iloc[:,-3:].values

    X_imputer = SimpleImputer(missing_values=np.nan, strategy='mean')
    X = X_imputer.fit_transform(X)

    y_imputer = SimpleImputer(missing_values=np.nan, strategy='mean')
    y = y_imputer.fit_transform(y)

    scaler = preprocessing.MinMaxScaler(feature_range = (0, 1))
    scale = scaler.fit_transform(X)
    df = pd.DataFrame(scale)

    X_train, X_test, y_train, y_test = train_test_split(scale, y, test_size=0.2, random_state=0)

    neigh = KNeighborsRegressor(n_neighbors=70)
    neigh.fit(X_train, y_train)

    y_KNN = neigh.predict(X_test)

    # Input

    input_array = np.array(inputs).reshape(1, -1)
    input_scaled = scaler.transform(input_array)
    prediction = neigh.predict(input_scaled).reshape(-1)

    R2 = r2_score(y_test, y_KNN)
    print("R2 SCORE: ", round(R2*100, 2), "%")


    return prediction

