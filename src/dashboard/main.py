import streamlit as st
import importlib.util

# Setting page config must be the very first Streamlit command
st.set_page_config(page_title="NexGen Wealth Manager", layout="wide", initial_sidebar_state="expanded")

# --- Institutional CSS Inject ---
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; background-color: #0b0e14; color: #e2e8f0; }
.stApp { background: #0b0e14; }
h1, h2, h3 { font-weight: 600; letter-spacing: -0.02em; color: #ffffff; }

/* Dashboard Cards */
.css-1r6slb0, .css-1qw2ntr {
    background-color: rgba(20, 25, 35, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1.5rem;
}

div[data-testid="stMetricValue"] {
    font-family: 'JetBrains Mono', monospace; font-size: 1.8rem; font-weight: 700; color: #38bdf8;
}

/* Sidebar Styling */
.css-1d391kg { background-color: #111827; border-right: 1px solid #1f2937; }

/* Hide default streamlit menu */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

if "token" not in st.session_state:
    st.session_state["token"] = None

def run_module(module_name, file_path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

# Multi-page Routing
if st.session_state["token"] is None:
    # Force Login screen
    import src.dashboard.pages.login as login_page
    login_page.show()
else:
    # Provide Sidebar Navigation
    st.sidebar.image("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ns_logo.svg/1200px-Ns_logo.svg.png", width=100)
    st.sidebar.title("NexGen Wealth")
    st.sidebar.caption("AI-Powered Institutional Portfolio Manager")
    
    st.sidebar.markdown("---")
    page = st.sidebar.radio("Navigation", 
                            ["Dashboard", "Portfolio Builder", "Mutual Funds Ranking", "Goal Planner"],
                            index=0)
    
    st.sidebar.markdown("---")
    if st.sidebar.button("Log Out"):
        st.session_state["token"] = None
        st.rerun()

    if page == "Dashboard":
        import src.dashboard.pages.dashboard as dashboard_page
        dashboard_page.show()
    elif page == "Portfolio Builder":
        import src.dashboard.pages.portfolio as portfolio_page
        portfolio_page.show()
    elif page == "Mutual Funds Ranking":
        import src.dashboard.pages.funds as funds_page
        funds_page.show()
    elif page == "Goal Planner":
        import src.dashboard.pages.goals as goals_page
        goals_page.show()
