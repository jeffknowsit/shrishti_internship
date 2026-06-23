import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from pandas.plotting import scatter_matrix
from sklearn.datasets import load_iris

# Load Iris dataset
iris = load_iris(as_frame=True)

X = iris.data
y = iris.target

st.write("### Iris Dataset")
st.dataframe(X.head())

# Create scatter matrix
fig, ax = plt.subplots(figsize=(10, 10))
scatter_matrix(X, figsize=(10, 10), diagonal='hist')

# Display in Streamlit
st.pyplot(plt.gcf())