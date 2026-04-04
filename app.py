import streamlit as st
import json
import os
from pathlib import Path
from datetime import datetime

# Configuration
NAMES = ["Tom", "Louis", "IndoorChris", "OutdoorChris", "Sophie", "Heather", "Zubair"]
PLAYER_ICONS = {
    "Tom": "🍣",
    "Louis": "☕",
    "IndoorChris": "👨‍💻",
    "OutdoorChris": "🚴",
    "Sophie": "💃",
    "Heather": "🏃‍♀️",
    "Zubair": "👨‍👦",
}
NUM_COLUMNS = 21
DATA_FILE = "progress_data.json"

# Define correct answers for each column (1-indexed)
CORRECT_ANSWERS = {
    1: "404b",
    2: "114",
    3: "17",
    4: "21aa",
    5: "t45",
    6: "ediw",
    7: "show()4",
    8: "73",
    9: "11",
    10: "2",
    11: "1247760",
    12: "158",
    13: "159C",
    14: "acdom",
    15: "14s3",
    16: "WINDOW",
    17: "BHBSPGC",
    18:"dX3k_QDnzHE",
    19: "ssddtleps",
    20: "YISTRKW",
    21: "sumsplit>sumacyclic",
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
        completion_time = user_data.get("completion_time", None)
        leaderboard.append({
            "name": name,
            "correct_count": correct_count,
            "is_complete": is_complete,
            "completion_time": completion_time
        })
    
    # Sort by correct count (descending), then by completion time, then by name
    leaderboard.sort(key=lambda x: (-x["correct_count"], x["completion_time"] or "9999", x["name"]))
    
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
    else:
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
            icon = PLAYER_ICONS.get(name, "")
            st.markdown(f"{icon} **{name}**")
        
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
                    
                    if is_correct_now:
                        # Show green box without text for correct answers
                        st.markdown(
                            f'<div style="background-color: #90EE90; padding: 5px; '
                            f'border-radius: 3px; height: 38px; border: 1px solid #ddd;"></div>',
                            unsafe_allow_html=True
                        )
                    else:
                        # User can see and edit their own input
                        new_value = st.text_input(
                            f"col_{col_num}",
                            value=current_value,
                            key=key,
                            label_visibility="collapsed"
                        )
                        
                        # Update data if value changed
                        if new_value != current_value:
                            # Reload latest data first to avoid overwriting others' changes
                            latest_data = load_data()
                            
                            # Merge: Update only this user's specific column
                            if name not in latest_data:
                                latest_data[name] = {}
                            latest_data[name][str(col_num)] = new_value
                            
                            # Track attempt count
                            attempt_key = f"{col_num}_attempts"
                            if attempt_key not in latest_data[name]:
                                latest_data[name][attempt_key] = 0
                            latest_data[name][attempt_key] += 1
                            
                            # Check if user just completed all tasks
                            user_data = latest_data[name]
                            correct_count = sum(
                                1 for c in range(1, NUM_COLUMNS + 1)
                                if is_correct_answer(c, user_data.get(str(c), ""))
                            )
                            if correct_count == NUM_COLUMNS and "completion_time" not in user_data:
                                user_data["completion_time"] = datetime.now().isoformat()
                            
                            # Save merged data
                            save_data(latest_data)
                            st.session_state.data = latest_data
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
    - Then there is 1 conceptual question
    - The a harder **Easter Egg Exercise** will be released
    
    ##### With 4 questions remaining:
    - There will be a final Menti test, where the winner will be awarded either the answer to any one question (except the final exercise and Exercise 17) of their choice, or a hint for any question of their choice (including Exercise 17 but excluding the final exercise), giving them an advantage over the other students.    - The top of the leaderboard, for the Menti tests over the past number of weeks, will also have this privellege. 
    - Then 4 questions will be released at varying times:
    - Question 18: the **HARDEST** exercise - please do this as early as possible
    - 2 Conceptual Questions
    - A Final PySpark exercise
    
    ### Progress Tracking:
    - **Select your name** from the sidebar to log in
    - **Enter your answers** in the cells in your row
    - When you enter the **correct answer**, the cell will turn **green** with your answer visible in black text
    - **Only you** can see what you type; others only see green cells for correct answers
    - Your progress is **automatically saved**
    - Turn all the cells green in your row to win!
    
    ### Gift Card:
    The **first person to complete all challenges** (turn all cells green) will be awarded the £20 Gift Card of their choice! 
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
    cols = st.columns([1, 2, 2, 2, 2])
    with cols[0]:
        st.markdown("**Rank**")
    with cols[1]:
        st.markdown("**Name**")
    with cols[2]:
        st.markdown("**Correct Answers**")
    with cols[3]:
        st.markdown("**Status**")
    with cols[4]:
        st.markdown("**Completed**")
    
    st.markdown("---")
    
    for entry in leaderboard:
        cols = st.columns([1, 2, 2, 2, 2])
        
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
            icon = PLAYER_ICONS.get(entry['name'], "")
            st.markdown(f"{icon} **{entry['name']}**")
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
        with cols[4]:
            if entry["completion_time"]:
                completion_dt = datetime.fromisoformat(entry["completion_time"])
                formatted_time = completion_dt.strftime("%b %d, %I:%M:%S %p")
                st.markdown(f"**{formatted_time}**")
            else:
                st.markdown("-")
    
    # Hardest Worker section
    st.markdown("---")
    st.markdown("### 💪 Hardest Worker!")
    
    # Calculate total attempts for each person
    attempt_counts = []
    for name in NAMES:
        user_data = st.session_state.data.get(name, {})
        total_attempts = sum(
            user_data.get(f"{col}_attempts", 0)
            for col in range(1, NUM_COLUMNS + 1)
        )
        if total_attempts > 0:
            attempt_counts.append({"name": name, "attempts": total_attempts})
    
    if attempt_counts:
        # Sort by attempts (descending)
        attempt_counts.sort(key=lambda x: -x["attempts"])
        hardest_worker = attempt_counts[0]
        
        st.info(f"🔥 **{hardest_worker['name']}** is working the hardest with **{hardest_worker['attempts']} total attempts** across all challenges!")
    else:
        st.info("No attempts recorded yet. Start solving challenges!")

if __name__ == "__main__":
    main()
