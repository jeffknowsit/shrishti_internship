import numpy as np
import pandas as pd
import streamlit as st
from sklearn.datasets import load_iris
iris = load_iris(as_frame=True)
X = iris.data
y = iris.target
df = pd.concat([X, pd.Series(y, name='target')], axis=1)
print('Features shape:', X.shape)
print('Target shape:', y.shape)
print('\nFeature names:', iris.feature_names)
print('Target names:', iris.target_names.tolist())
# Show a sample of the dataset
st.write(df.head())

import matplotlib.pyplot as plt
from pandas.plotting import scatter_matrix
# Reduce text size for readability
pd.options.display.max_columns = None
0
0
# Scatter matrix (pairwise scatter plots)
axes = scatter_matrix(X, figsize=(10, 10), diagonal='hist')
# Improve layout
st.write('Iris Feature Pairwise Scatter Matrix')
