import streamlit as st
import pandas as pd
import numpy as np
import joblib
import pickle
import json

# --------------------------------------------------
# Page Configuration
# --------------------------------------------------

st.set_page_config(
    page_title="Iris Flower Classifier",
    page_icon="🌸",
    layout="wide"
)

# --------------------------------------------------
# Custom CSS
# --------------------------------------------------

st.markdown("""
<style>
.main-header {
    text-align: center;
    color: #6a0dad;
    font-size: 3rem;
    margin-bottom: 20px;
}

.prediction-card {
    padding: 20px;
    border-radius: 10px;
    background-color: #f8f9fa;
    border-left: 5px solid #6a0dad;
}
</style>
""", unsafe_allow_html=True)

# --------------------------------------------------
# Load Resources
# --------------------------------------------------

@st.cache_resource
def load_model(model_format):
    try:
        if model_format == "joblib":
            return joblib.load("models/iris_model.joblib")

        with open("models/iris_model.pickle", "rb") as f:
            return pickle.load(f)

    except Exception as e:
        st.error(f"Error loading model: {e}")
        return None


@st.cache_data
def load_model_info():
    try:
        with open("models/model_info.json", "r") as f:
            return json.load(f)
    except:
        return {
            "model_type": "Random Forest",
            "accuracy": 0.96,
            "target_names": [
                "setosa",
                "versicolor",
                "virginica"
            ]
        }


@st.cache_data
def load_feature_ranges():
    try:
        with open("models/feature_ranges.json", "r") as f:
            return json.load(f)
    except:
        return {
            "sepal_length": {"min": 4.0, "max": 8.0, "default": 5.8},
            "sepal_width": {"min": 2.0, "max": 4.5, "default": 3.0},
            "petal_length": {"min": 1.0, "max": 7.0, "default": 4.0},
            "petal_width": {"min": 0.1, "max": 2.5, "default": 1.2},
        }


# --------------------------------------------------
# Sidebar
# --------------------------------------------------

with st.sidebar:
    st.title("⚙️ Settings")

    model_format = st.radio(
        "Select Model Format",
        ["joblib", "pickle"]
    )

    st.divider()

    st.subheader("ℹ️ Model Information")

model_info = load_model_info()
feature_ranges = load_feature_ranges()
model = load_model(model_format)

if model_info:
    with st.sidebar:
        st.write(
            f"**Type:** {model_info.get('model_type', 'Random Forest')}"
        )
        st.write(
            f"**Accuracy:** {model_info.get('accuracy', 0.96):.1%}"
        )

# --------------------------------------------------
# Main Title
# --------------------------------------------------

st.markdown(
    '<h1 class="main-header">🌸 Iris Flower Classification</h1>',
    unsafe_allow_html=True
)

st.write(
    """
    Predict the species of an Iris flower using a trained
    machine learning model.

    Adjust the flower measurements below and click
    **Predict Species**.
    """
)

# --------------------------------------------------
# Layout
# --------------------------------------------------

col1, col2 = st.columns([2, 1])

with col1:

    st.subheader("📝 Input Features")

    sepal_length = st.slider(
        "Sepal Length (cm)",
        float(feature_ranges["sepal_length"]["min"]),
        float(feature_ranges["sepal_length"]["max"]),
        float(feature_ranges["sepal_length"]["default"]),
        0.1
    )

    sepal_width = st.slider(
        "Sepal Width (cm)",
        float(feature_ranges["sepal_width"]["min"]),
        float(feature_ranges["sepal_width"]["max"]),
        float(feature_ranges["sepal_width"]["default"]),
        0.1
    )

    petal_length = st.slider(
        "Petal Length (cm)",
        float(feature_ranges["petal_length"]["min"]),
        float(feature_ranges["petal_length"]["max"]),
        float(feature_ranges["petal_length"]["default"]),
        0.1
    )

    petal_width = st.slider(
        "Petal Width (cm)",
        float(feature_ranges["petal_width"]["min"]),
        float(feature_ranges["petal_width"]["max"]),
        float(feature_ranges["petal_width"]["default"]),
        0.1
    )

with col2:

    st.subheader("📊 Current Values")

    features_df = pd.DataFrame({
        "Feature": [
            "Sepal Length",
            "Sepal Width",
            "Petal Length",
            "Petal Width"
        ],
        "Value": [
            sepal_length,
            sepal_width,
            petal_length,
            petal_width
        ]
    })

    st.dataframe(
        features_df,
        use_container_width=True,
        hide_index=True
    )

# --------------------------------------------------
# Prediction
# --------------------------------------------------

input_features = np.array([
    [
        sepal_length,
        sepal_width,
        petal_length,
        petal_width
    ]
])

if st.button(
    "🎯 Predict Species",
    type="primary",
    use_container_width=True
):

    if model is None:
        st.error("Model could not be loaded.")
        st.stop()

    try:
        prediction = model.predict(input_features)[0]

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_features)[0]
        else:
            probabilities = None

        target_names = model_info.get(
            "target_names",
            ["setosa", "versicolor", "virginica"]
        )

        predicted_species = target_names[prediction]

        st.markdown(
            f"""
            <div class="prediction-card">
                <h2>🌸 Prediction Result</h2>
                <h3>{predicted_species}</h3>
            </div>
            """,
            unsafe_allow_html=True
        )

        if probabilities is not None:

            st.subheader("📈 Confidence Scores")

            for species, prob in zip(target_names, probabilities):
                st.write(f"**{species}**")
                st.progress(float(prob))
                st.write(f"{prob:.2%}")

    except Exception as e:
        st.error(f"Prediction Error: {e}")

# --------------------------------------------------
# Dataset Information
# --------------------------------------------------

with st.expander("📚 About the Iris Dataset"):

    st.markdown("""
### Dataset Overview

The Iris dataset contains:

- 150 flower samples
- 3 species
- 4 numerical features

### Species

- Iris Setosa
- Iris Versicolor
- Iris Virginica

### Features

1. Sepal Length
2. Sepal Width
3. Petal Length
4. Petal Width

This is one of the most famous datasets in machine learning.
""")

# --------------------------------------------------
# Footer
# --------------------------------------------------

st.markdown("---")
st.caption("Built with Streamlit and Scikit-learn")
