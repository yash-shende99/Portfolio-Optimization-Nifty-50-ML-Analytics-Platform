import streamlit as st
import requests

API_URL = "http://localhost:8000"

def show():
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.image("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ns_logo.svg/1200px-Ns_logo.svg.png", width=150)
        st.title("NexGen Wealth")
        st.caption("Institutional A.I. Portfolio Management System")
        st.markdown("---")
        
        tab1, tab2 = st.tabs(["🔒 Login", "📝 Create Account"])
        
        with tab1:
            with st.form("login_form"):
                username = st.text_input("Username")
                password = st.text_input("Password", type="password")
                submitted = st.form_submit_button("Sign In")
                
                if submitted:
                    res = requests.post(f"{API_URL}/auth/token", data={"username": username, "password": password})
                    if res.status_code == 200:
                        st.session_state["token"] = res.json()["access_token"]
                        st.session_state["username"] = username
                        st.rerun()
                    else:
                        st.error("Invalid credentials. Please try again.")
                        
        with tab2:
            st.markdown("### Join NexGen Quant")
            with st.form("signup_form"):
                new_username = st.text_input("Choose Username")
                new_password = st.text_input("Choose Password", type="password")
                
                st.markdown("##### 🎯 Wealth Profile Assessment")
                age = st.number_input("Age", min_value=18, max_value=100, value=30)
                income = st.number_input("Annual Income (₹)", min_value=0, value=1500000, step=100000)
                savings = st.number_input("Target Monthly Savings (₹)", min_value=0, value=25000, step=5000)
                
                st.markdown("##### ⚖️ Risk Personality")
                risk_profile = st.select_slider(
                    "How would you describe your investment style?",
                    options=["Very Conservative", "Balanced", "Growth", "Aggressive"],
                    value="Growth"
                )
                
                # Map to numeric risk tolerance lambda (lower is more aggressive)
                risk_map = {
                    "Very Conservative": 0.9,
                    "Balanced": 0.6,
                    "Growth": 0.4,
                    "Aggressive": 0.1
                }
                
                signup_submitted = st.form_submit_button("Create Profile & Start Investing")
                
                if signup_submitted:
                    if not new_username or not new_password:
                        st.error("Username and password are required.")
                    else:
                        # 1. Register User
                        reg_res = requests.post(f"{API_URL}/auth/register", json={"username": new_username, "password": new_password})
                        if reg_res.status_code == 200:
                            token = reg_res.json()["access_token"]
                            st.session_state["token"] = token
                            st.session_state["username"] = new_username
                            
                            # 2. Update Profile
                            headers = {"Authorization": f"Bearer {token}"}
                            prof_data = {
                                "age": age,
                                "income": income,
                                "monthly_savings": savings,
                                "risk_tolerance": risk_map[risk_profile],
                                "goals": []
                            }
                            prof_res = requests.post(f"{API_URL}/auth/profile", json=prof_data, headers=headers)
                            
                            st.success("Profile created successfully! Loading terminal...")
                            st.rerun()
                        else:
                            st.error(f"Registration failed: {reg_res.text}")
