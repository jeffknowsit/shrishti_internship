import streamlit as st
st.title("project_1 ")
st.write("Hello this is my first app :)")
name=st.text_input("Enter your name")
if name:
    st.write("Welcome back ",name)

if st.button("CLICK ME !!!!"):
    st.write("you clicked button !!!")

agree=st.checkbox("CLick to agree")
if agree:
    st.write("yay you agreed")
    
else:
    st.write("please agree to continue")
option=st.selectbox("Select number ",[1,2,3,4,5,6,7,8,9,10])
if option:
    st.write("You clicked ",option)
value=st.slider("Select a number from the slider",0,219,22)
st.write("The value current in slider is ",value)
