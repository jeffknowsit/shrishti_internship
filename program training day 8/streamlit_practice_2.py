import streamlit as st
import numpy as np
import pandas as pd
data=pd.DataFrame(np.random.rand(7,3),columns=["A","B","C"])
st.header("ML overeview from pandas dataframe")
st.line_chart(data)
st.bar_chart(data)
st.area_chart(data)

pdf=st.file_uploader("Upload your CSV",type=["csv"])
if pdf:
    data=pd.read_csv(pdf)
    st.dataframe(data)
    st.write(data["Age"].tail())
st.sidebar.write("hello from sidebar ")
name1 =st.sidebar.text_input("HEllo enter your name :)")