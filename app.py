import streamlit as st
import json
import os
from pathlib import Path

# Configuration
NAMES = ["Esther", "Bobby", "Doug", "Benedict", "Lorik", "Benjamin", 
         "Emily", "Sebastien", "Hamsa", "Kate", "Harry", "Brian"]
NUM_COLUMNS = 18
DATA_FILE = "progress_data.json"

# Define correct answers for each column (1-indexed)
# You can modify these to set what the correct input is for each column
CORRECT_ANSWERS = {
    1: "answer1",
    2: "answer2",
    3: "answer3",
    4: "answer4",
    5: "answer5",
    6: "answer6",
    7: "answer7",
    8: "answer8",
    9: "answer9",
    10: "answer10",
    11: "answer11",
    12: "answer12",
    13: "answer13",
    14: "answer14",
    15: "answer15",
    16: "answer16",
    17: "answer17",
    18: "answer18",
}

def load_data():
    """Load progress data from JSON file."""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_data(data):
    """Save progress data to JSON file."""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def is_correct_answer(column_num, answer):
    """Check if the answer is correct for the given column."""
    return answer.strip().lower() == CORRECT_ANSWERS.get(column_num, "").lower()

def calculate_leaderboard(data):
    """Calculate leaderboard based on number of correct answers."""
    leaderboard = []
    for name in NAMES:
        user_data = data.get(name, {})
        correct_count = sum(
            1 for col_num in range(1, NUM_COLUMNS + 1)
            if is_correct_answer(col_num, user_data.get(str(col_num), ""))
        )
        is_complete = correct_count == NUM_COLUMNS
        leaderboard.append({
            "name": name,
            "correct_count": correct_count,
            "is_complete": is_complete
        })
    
    # Sort by correct count (descending), then by name (ascending)
    leaderboard.sort(key=lambda x: (-x["correct_count"], x["name"]))
    
    # Assign positions
    position = 1
    for i, entry in enumerate(leaderboard):
        if i > 0 and leaderboard[i]["correct_count"] != leaderboard[i-1]["correct_count"]:
            position = i + 1
        entry["position"] = position
    
    return leaderboard

def main():
    st.set_page_config(page_title="Data Engineer Championship", layout="wide")
    
    # Title
    st.title("🏆 7-Day Data Engineering Challenge")
    
    # User selection
    st.sidebar.header("Login")
    current_user = st.sidebar.selectbox("Select your name:", [""] + NAMES)
    
    if not current_user:
        st.info("Please select your name from the sidebar to view and edit your progress.")
        return
    
    st.sidebar.success(f"Logged in as: {current_user}")
    
    # Load existing data
    if 'data' not in st.session_state:
        st.session_state.data = load_data()
    
    # Ensure user has an entry in the data
    if current_user not in st.session_state.data:
        st.session_state.data[current_user] = {}
    
    # Create tabs
    tab1, tab2 = st.tabs(["📝 Progress Table", "🏅 Leaderboard"])
    
    # TAB 1: Progress Table
    with tab1:
        render_progress_table(current_user)
    
    # TAB 2: Leaderboard
    with tab2:
        render_leaderboard()
    
    # Admin section (optional - for setting correct answers)
    with st.sidebar.expander("Admin: View Correct Answers"):
        st.markdown("**Correct answers by column:**")
        for col_num, answer in CORRECT_ANSWERS.items():
            st.text(f"Col {col_num}: {answer}")

def render_progress_table(current_user):
    """Render the progress table."""
    # Calculate leaderboard to show current leader
    leaderboard = calculate_leaderboard(st.session_state.data)
    
    # Display current leader(s)
    top_entries = [e for e in leaderboard if e["position"] == 1]
    if len(top_entries) == 1:
        leader = top_entries[0]
        if leader["is_complete"]:
            st.success(f"🎉 **{leader['name']}** has completed all challenges and finished in 1st Place!")
        else:
            st.info(f"🏆 **Current Leader: {leader['name']}** with {leader['correct_count']}/{NUM_COLUMNS} correct answers")
    else:
        # Multiple people tied for first
        leader_names = ", ".join([e["name"] for e in top_entries])
        st.info(f"🏆 **Current Leaders (Tied): {leader_names}** with {top_entries[0]['correct_count']}/{NUM_COLUMNS} correct answers")
    
    st.markdown("---")
    
    # Create columns for the table
    cols = st.columns([2] + [1] * NUM_COLUMNS)
    
    # Header row
    with cols[0]:
        st.markdown("**Name**")
    for i in range(NUM_COLUMNS):
        with cols[i + 1]:
            st.markdown(f"**Col {i + 1}**")
    
    # Data rows
    for name in NAMES:
        cols = st.columns([2] + [1] * NUM_COLUMNS)
        
        with cols[0]:
            st.markdown(f"**{name}**")
        
        for col_idx in range(NUM_COLUMNS):
            col_num = col_idx + 1
            key = f"{name}_{col_num}"
            
            with cols[col_idx + 1]:
                # Get current value for this cell
                user_data = st.session_state.data.get(name, {})
                current_value = user_data.get(str(col_num), "")
                
                # Check if current value is correct
                is_correct = is_correct_answer(col_num, current_value) if current_value else False
                
                # Only the current user can edit their own cells
                if name == current_user:
                    # Check if answer is correct before rendering
                    is_correct_now = is_correct_answer(col_num, current_value) if current_value else False
                    
                    # Apply custom CSS for green background with black text when correct
                    if is_correct_now:
                        st.markdown(
                            f"""
                            <style>
                            input[aria-label="col_{col_num}"] {{
                                background-color: #90EE90 !important;
                                color: #000000 !important;
                            }}
                            </style>
                            """,
                            unsafe_allow_html=True
                        )
                    
                    # User can see and edit their own input
                    new_value = st.text_input(
                        f"col_{col_num}",
                        value=current_value,
                        key=key,
                        label_visibility="collapsed"
                    )
                    
                    # Update data if value changed
                    if new_value != current_value:
                        st.session_state.data[name][str(col_num)] = new_value
                        save_data(st.session_state.data)
                        st.rerun()
                else:
                    # Other users only see a green box if the answer is correct
                    if is_correct:
                        st.markdown(
                            f'<div style="background-color: #90EE90; padding: 5px; '
                            f'border-radius: 3px; height: 38px; border: 1px solid #ddd;"></div>',
                            unsafe_allow_html=True
                        )
                    else:
                        # Show empty box for incorrect or empty answers
                        st.markdown(
                            f'<div style="background-color: white; padding: 5px; '
                            f'border-radius: 3px; height: 38px; border: 1px solid #ddd;"></div>',
                            unsafe_allow_html=True
                        )
    
    # Instructions
    st.markdown("---")
    st.markdown("""
    ## 📚 Challenge Instructions
    
    ### How It Works:
    Over the next week, you will complete a series of **PySpark and SQL exercises** that build on the topics you've already learned. 
    Each exercise you solve will reveal a piece of a **secret code** that you'll enter into your row in the table above. 
    The **first person** to turn all their cells green wins a **£20 Amazon Gift Card!**
    
    ### Example:
    - **Final code to solve:** `_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _`
    - **Solving Exercise 1** → gives code `E3Y`
    - **Final code to solve:** `E 3 Y _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _`
    - After solving this exercise, you will solve the following one to reveal another code which you append to the end of the first code you solved
    - **Solving Exercise 2** → gives code `AB4`
    - **Final code to solve:** `E 3 Y A B 4 _ _ _ _ _ _ _ _ _ _ _ _ _ _ _`
    - And so on...
    
    ### Daily Exercises and Tests:
    - The **first 8 exercises** will be **PySpark exercises**
    - The **second set** of exercises are **8 SQL exercises** following the same format
    - The **third** is a **Menti Test**, where the winner will be awarded with the penultimate portion of the code giving them an advantage over the other students
    - Finally **2 exercises** will be released shortly after:
      - One to solve the penultimate portion of the code (for those who did not win the Menti Test)
      - A final PySpark exercise
    
    ### Progress Tracking:
    - **Select your name** from the sidebar to log in
    - **Enter your answers** in the cells in your row
    - When you enter the **correct answer**, the cell will turn **green** with your answer visible in black text
    - **Only you** can see what you type; others only see green cells for correct answers
    - Your progress is **automatically saved**
    - Turn all the cells green in your row to win!

    ### Tools:
    - For the PySpark exercises use https://www.sparkplayground.com/pyspark-online-compiler
    - For W3 Schools exercises use https://www.w3schools.com/sql/trysql.asp?filename=trysql_select_all
    
    ### Gift Card:
    The **first person to complete all challenges** (turn all cells green) will be awarded the £20 Amazon Gift Card! 
    Track your progress in the table above, and check the **Leaderboard** tab to see who has the most green boxes in real time!
    """)

def render_leaderboard():
    """Render the leaderboard."""
    st.markdown("### 🏅 Live Leaderboard")
    st.markdown("Track who's leading the challenge!")
    st.markdown("---")
    
    # Calculate leaderboard
    leaderboard = calculate_leaderboard(st.session_state.data)
    
    # Display leaderboard
    cols = st.columns([1, 3, 2, 2])
    with cols[0]:
        st.markdown("**Rank**")
    with cols[1]:
        st.markdown("**Name**")
    with cols[2]:
        st.markdown("**Correct Answers**")
    with cols[3]:
        st.markdown("**Status**")
    
    st.markdown("---")
    
    for entry in leaderboard:
        cols = st.columns([1, 3, 2, 2])
        
        # Medal for top 3
        medal = ""
        if entry["position"] == 1:
            medal = "🥇"
        elif entry["position"] == 2:
            medal = "🥈"
        elif entry["position"] == 3:
            medal = "🥉"
        
        with cols[0]:
            st.markdown(f"{medal} **{entry['position']}**")
        with cols[1]:
            st.markdown(f"**{entry['name']}**")
        with cols[2]:
            position_suffix = "st" if entry["position"] == 1 else "nd" if entry["position"] == 2 else "rd" if entry["position"] == 3 else "th"
            progress_bar_html = f"""
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex-grow: 1; background-color: #f0f0f0; border-radius: 5px; height: 20px; overflow: hidden;">
                    <div style="background-color: #90EE90; height: 100%; width: {(entry['correct_count']/NUM_COLUMNS)*100}%;"></div>
                </div>
                <span style="font-weight: bold;">{entry['correct_count']}/{NUM_COLUMNS}</span>
            </div>
            """
            st.markdown(progress_bar_html, unsafe_allow_html=True)
        with cols[3]:
            if entry["is_complete"]:
                st.markdown(f"✅ **{entry['position']}{position_suffix} Place!**")
            else:
                st.markdown(f"**{entry['position']}{position_suffix} Place**")

if __name__ == "__main__":
    main()
