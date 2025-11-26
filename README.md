# Data Engineer Championship Progress Table

A Streamlit web app for tracking progress in a Data Engineer Championship with privacy-preserving features.

## Features

- **12 participants** with individual rows
- **18 challenge columns** for tracking progress
- **Privacy-first**: Only you can see what you type; others only see green cells when you get it right
- **Auto-save**: Your progress is automatically saved
- **Color-coded feedback**: Cells turn green when correct answers are entered

## Running Locally

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the app:
```bash
streamlit run app.py
```

3. Open your browser to `http://localhost:8501`

## Deploying to Streamlit Cloud

1. Push this repository to GitHub

2. Go to [share.streamlit.io](https://share.streamlit.io)

3. Sign in with GitHub

4. Click "New app"

5. Select your repository and set:
   - **Main file path**: `app.py`
   - Click "Deploy"

Your app will be live at `https://share.streamlit.io/[username]/[repo-name]/main/app.py`

## Configuration

To set the correct answers for each column, edit the `CORRECT_ANSWERS` dictionary in `app.py`:

```python
CORRECT_ANSWERS = {
    1: "answer1",
    2: "answer2",
    # ... etc
}
```

## How It Works

1. **Login**: Select your name from the sidebar
2. **Enter answers**: Type your answers in the cells in your row
3. **Get feedback**: Cells turn green when you enter the correct answer
4. **Privacy**: Only you see your text; others only see green cells for correct answers

## Data Storage

Progress is stored in `progress_data.json` which will be created automatically when users start entering data.

**Note for Streamlit Cloud**: The free tier doesn't persist files between deployments. For persistent storage, you'll need to integrate a database (e.g., Streamlit's built-in secrets + Google Sheets, or a cloud database).

## Participants

- Esther
- Bobby
- Doug
- Benedict
- Lorik
- Benjamin
- Emily
- Sebastien
- Hamsa
- Kate
- Harry
- Brian
