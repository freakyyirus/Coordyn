"""
AutoNegotiate — Multi-Agent Negotiation Dashboard
A real-time visualization of AI agents negotiating logistics contracts.
"""

import asyncio
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import time

from config import SCENARIOS, STRATEGIES
from negotiation import NegotiationEngine, run_batch_simulations
from utils import (
    get_agent_emoji,
    get_agent_color,
    format_duration,
)

# ── Page Config ──────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="AutoNegotiate | Multi-Agent AI",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ───────────────────────────────────────────────────────────────

st.markdown("""
<style>
/* ── Google Font ── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* { font-family: 'Inter', sans-serif; }

/* ── Hero header ── */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 2.5rem 2rem;
    margin-bottom: 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
}
.hero::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%);
    animation: pulse 4s ease-in-out infinite;
}
@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.05); opacity: 1; }
}
.hero h1 {
    font-size: 2.2rem;
    font-weight: 800;
    color: white;
    margin: 0;
    letter-spacing: -0.5px;
    position: relative;
    z-index: 1;
}
.hero p {
    color: rgba(255,255,255,0.85);
    font-size: 1rem;
    margin-top: 0.5rem;
    position: relative;
    z-index: 1;
}

/* ── Metric cards ── */
.metric-card {
    background: linear-gradient(145deg, #1E2130, #252940);
    border: 1px solid rgba(108,99,255,0.2);
    border-radius: 12px;
    padding: 1.2rem;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
}
.metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(108,99,255,0.15);
}
.metric-value {
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(135deg, #6C63FF, #4ECDC4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0.3rem 0;
}
.metric-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255,255,255,0.5);
}

/* ── Chat bubbles ── */
.chat-msg {
    background: #1E2130;
    border-left: 3px solid;
    border-radius: 0 10px 10px 0;
    padding: 0.8rem 1rem;
    margin: 0.5rem 0;
    animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
}
.chat-sender {
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
}
.chat-content {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.85);
    line-height: 1.5;
}
.chat-round {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
    margin-top: 0.3rem;
}

/* ── Sidebar tweaks ── */
section[data-testid="stSidebar"] {
    background: #12141C;
    border-right: 1px solid rgba(108,99,255,0.15);
}
section[data-testid="stSidebar"] .stSelectbox label,
section[data-testid="stSidebar"] .stCheckbox label {
    color: rgba(255,255,255,0.8) !important;
    font-weight: 500;
}

/* ── Deal banner ── */
.deal-banner {
    padding: 1.2rem;
    border-radius: 12px;
    text-align: center;
    font-weight: 700;
    font-size: 1.2rem;
    margin: 1rem 0;
}
.deal-success {
    background: linear-gradient(135deg, rgba(78,205,196,0.15), rgba(108,99,255,0.15));
    border: 1px solid rgba(78,205,196,0.4);
    color: #4ECDC4;
}
.deal-fail {
    background: linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,107,107,0.05));
    border: 1px solid rgba(255,107,107,0.4);
    color: #FF6B6B;
}

/* ── Section headers ── */
.section-header {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(108,99,255,0.3);
    margin: 1.5rem 0 1rem;
}

/* ── Table style ── */
.dataframe { border-radius: 8px !important; overflow: hidden; }

/* Hide default streamlit padding for wide mode */
.block-container { padding-top: 1rem; }
</style>
""", unsafe_allow_html=True)

# ── Hero Header ──────────────────────────────────────────────────────────────

st.markdown("""
<div class="hero">
    <h1>🤖 AutoNegotiate</h1>
    <p>Autonomous Multi-Agent Negotiation for Supply Chain Resource Allocation</p>
</div>
""", unsafe_allow_html=True)

# ── Sidebar Controls ─────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("### ⚙️ Simulation Controls")
    st.markdown("---")

    scenario = st.selectbox(
        "📍 Scenario",
        list(SCENARIOS.keys()),
        help="Choose a logistics negotiation scenario",
    )
    st.caption(SCENARIOS[scenario]["description"])

    st.markdown("")
    strategy = st.selectbox(
        "🧠 Strategy",
        list(STRATEGIES.keys()),
        format_func=lambda s: STRATEGIES[s]["label"],
        index=2,  # Default: balanced
        help="Agent negotiation behavior",
    )
    st.caption(STRATEGIES[strategy]["description"])

    st.markdown("")
    include_warehouse = st.checkbox(
        "🏭 Include Warehouse Agent",
        value=False,
        help="Add a 3rd agent (Warehouse Manager) to the negotiation",
    )

    max_turns = st.slider(
        "🔁 Max Rounds",
        min_value=4,
        max_value=20,
        value=12,
        help="Maximum number of negotiation turns",
    )

    st.markdown("---")
    st.markdown("### 🚀 Actions")

    run_single = st.button(
        "▶️  Start Negotiation",
        type="primary",
        use_container_width=True,
    )

    st.markdown("")
    run_batch = st.button(
        "📊  Compare All Strategies",
        use_container_width=True,
        help="Run negotiations across all 3 strategies and compare",
    )

    st.markdown("---")
    st.markdown(
        "<div style='text-align:center; color: rgba(255,255,255,0.3); font-size: 0.7rem;'>"
        "Built with AutoGen + Streamlit<br>ByteCamp '26 Hackathon"
        "</div>",
        unsafe_allow_html=True,
    )


# ── Helper: render metrics row ───────────────────────────────────────────────

def render_metrics(result):
    cols = st.columns(4)
    metrics = [
        ("Outcome", "✅ Deal!" if result.success else ("❌ No Deal" if result.rejected else "⏱️ Timed Out")),
        ("Rounds", str(result.rounds)),
        ("Final Price", f"${result.final_price:,.0f}" if result.final_price else "N/A"),
        ("Pareto Efficiency", f"{result.pareto_efficiency:.0f}%"),
    ]
    for col, (label, value) in zip(cols, metrics):
        with col:
            st.markdown(
                f'<div class="metric-card">'
                f'<div class="metric-label">{label}</div>'
                f'<div class="metric-value">{value}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )


# ── Helper: render transcript ────────────────────────────────────────────────

def render_transcript(messages):
    for msg in messages:
        emoji = get_agent_emoji(msg.sender)
        color = get_agent_color(msg.sender)
        st.markdown(
            f'<div class="chat-msg" style="border-left-color: {color};">'
            f'<div class="chat-sender" style="color: {color};">{emoji} {msg.sender}</div>'
            f'<div class="chat-content">{msg.content}</div>'
            f'<div class="chat-round">Round {msg.round}'
            f'{f" · 💰 ${msg.price_mentioned:,.0f}" if msg.price_mentioned else ""}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )


# ── Helper: render charts ───────────────────────────────────────────────────

def render_charts(result):
    col1, col2 = st.columns(2)

    # Price trajectory
    with col1:
        st.markdown('<div class="section-header">💰 Price Trajectory</div>', unsafe_allow_html=True)
        if result.price_trajectory:
            df = pd.DataFrame(result.price_trajectory)
            fig = go.Figure()
            for agent in df["agent"].unique():
                agent_df = df[df["agent"] == agent]
                fig.add_trace(go.Scatter(
                    x=agent_df["round"],
                    y=agent_df["price"],
                    mode="lines+markers",
                    name=f"{get_agent_emoji(agent)} {agent}",
                    line=dict(color=get_agent_color(agent), width=3),
                    marker=dict(size=8),
                ))

            # Add budget/floor reference lines
            scenario_data = SCENARIOS[scenario]
            fig.add_hline(
                y=scenario_data["shipper"]["max_budget"],
                line_dash="dash",
                line_color="rgba(108,99,255,0.4)",
                annotation_text="Shipper Max Budget",
                annotation_position="top left",
            )
            fig.add_hline(
                y=scenario_data["carrier"]["min_price"],
                line_dash="dash",
                line_color="rgba(255,107,107,0.4)",
                annotation_text="Carrier Min Price",
                annotation_position="bottom left",
            )

            fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                xaxis_title="Round",
                yaxis_title="Price ($)",
                yaxis_tickformat="$,.0f",
                height=350,
                margin=dict(l=20, r=20, t=20, b=40),
                legend=dict(orientation="h", y=-0.2),
                font=dict(family="Inter"),
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No price data extracted from this negotiation.")

    # Utility progression
    with col2:
        st.markdown('<div class="section-header">📈 Utility Progression</div>', unsafe_allow_html=True)
        if result.utility_trajectory:
            df = pd.DataFrame(result.utility_trajectory)
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df["round"], y=df["shipper"],
                mode="lines+markers",
                name=f"{get_agent_emoji('Shipper')} Shipper Utility",
                line=dict(color="#6C63FF", width=3),
                marker=dict(size=8),
                fill="tozeroy",
                fillcolor="rgba(108,99,255,0.1)",
            ))
            fig.add_trace(go.Scatter(
                x=df["round"], y=df["carrier"],
                mode="lines+markers",
                name=f"{get_agent_emoji('Carrier')} Carrier Utility",
                line=dict(color="#FF6B6B", width=3),
                marker=dict(size=8),
                fill="tozeroy",
                fillcolor="rgba(255,107,107,0.1)",
            ))
            fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                xaxis_title="Round",
                yaxis_title="Utility Score",
                yaxis_range=[0, 1.05],
                height=350,
                margin=dict(l=20, r=20, t=20, b=40),
                legend=dict(orientation="h", y=-0.2),
                font=dict(family="Inter"),
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No utility data for this negotiation.")

    # Utility bar comparison
    if result.final_price:
        st.markdown('<div class="section-header">🎯 Final Utility Breakdown</div>', unsafe_allow_html=True)
        col_a, col_b, col_c = st.columns([1, 2, 1])
        with col_b:
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=["Shipper", "Carrier"],
                y=[result.shipper_utility, result.carrier_utility],
                marker_color=["#6C63FF", "#FF6B6B"],
                text=[f"{result.shipper_utility:.2f}", f"{result.carrier_utility:.2f}"],
                textposition="outside",
                textfont=dict(size=16, color="white"),
            ))
            fig.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                yaxis_range=[0, 1.2],
                yaxis_title="Utility",
                height=280,
                margin=dict(l=20, r=20, t=10, b=40),
                font=dict(family="Inter"),
            )
            st.plotly_chart(fig, use_container_width=True)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN ACTIONS
# ══════════════════════════════════════════════════════════════════════════════

if run_single:
    # ── Single Negotiation ────────────────────────────────────────────────
    st.markdown('<div class="section-header">🔴 Live Negotiation</div>', unsafe_allow_html=True)

    progress = st.progress(0, text="Initializing agents...")

    try:
        engine = NegotiationEngine(
            scenario_name=scenario,
            strategy_name=strategy,
            include_warehouse=include_warehouse,
            max_turns=max_turns,
        )

        progress.progress(15, text="Agents are negotiating...")

        result = asyncio.run(engine.run())

        progress.progress(100, text="Negotiation complete!")
        time.sleep(0.3)
        progress.empty()

        # Deal banner
        if result.success:
            st.markdown(
                '<div class="deal-banner deal-success">🎉 DEAL ACCEPTED — '
                f'Both parties reached an agreement!</div>',
                unsafe_allow_html=True,
            )
        elif result.rejected:
            st.markdown(
                '<div class="deal-banner deal-fail">💔 DEAL REJECTED — '
                f'Agents could not reach consensus</div>',
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                '<div class="deal-banner deal-fail">⏱️ MAX ROUNDS REACHED — '
                f'Negotiation timed out after {result.rounds} rounds</div>',
                unsafe_allow_html=True,
            )

        # Metrics row
        render_metrics(result)

        st.markdown("")

        # Details
        if result.deal_details:
            st.markdown(
                f'<div style="background:#1E2130; border-radius:10px; padding:1rem; '
                f'border: 1px solid rgba(108,99,255,0.2); margin: 0.5rem 0;">'
                f'<strong>📋 Deal Terms:</strong> {result.deal_details}<br>'
                f'<strong>⏱️ Duration:</strong> {format_duration(result.duration)}'
                f'</div>',
                unsafe_allow_html=True,
            )

        # Charts
        render_charts(result)

        # Transcript
        st.markdown('<div class="section-header">📜 Full Transcript</div>', unsafe_allow_html=True)
        with st.expander("View all messages", expanded=True):
            render_transcript(result.messages)

    except ValueError as e:
        st.error(f"⚠️ Configuration Error: {e}")
    except Exception as e:
        st.error(f"❌ Error during negotiation: {e}")
        st.exception(e)


elif run_batch:
    # ── Strategy Comparison ───────────────────────────────────────────────
    st.markdown('<div class="section-header">📊 Strategy Comparison</div>', unsafe_allow_html=True)

    progress = st.progress(0, text="Running batch simulations...")

    try:
        strategy_list = list(STRATEGIES.keys())
        batch_results = asyncio.run(
            run_batch_simulations(
                scenario_name=scenario,
                strategies=strategy_list,
                runs_per_strategy=3,
                include_warehouse=include_warehouse,
            )
        )

        progress.progress(100, text="All simulations complete!")
        time.sleep(0.3)
        progress.empty()

        # Results table
        df = pd.DataFrame(batch_results)
        df["strategy"] = df["strategy"].map(lambda s: STRATEGIES[s]["label"])
        df.columns = ["Strategy", "Runs", "Deal Rate", "Deal %", "Avg Rounds", "Avg Price ($)", "Pareto (%)"]

        st.dataframe(
            df.style.format({
                "Avg Price ($)": "${:,.0f}",
                "Pareto (%)": "{:.0f}%",
                "Deal %": "{:.0f}%",
            }).background_gradient(subset=["Pareto (%)"], cmap="YlGn"),
            use_container_width=True,
            hide_index=True,
        )

        # Comparison charts
        col1, col2 = st.columns(2)

        with col1:
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=[STRATEGIES[r["strategy"]]["label"] if r["strategy"] in STRATEGIES else r["strategy"]
                   for r in batch_results],
                y=[r["deal_pct"] for r in batch_results],
                marker_color=["#4ECDC4", "#FF6B6B", "#6C63FF"],
                text=[f'{r["deal_pct"]:.0f}%' for r in batch_results],
                textposition="outside",
                textfont=dict(color="white", size=14),
            ))
            fig.update_layout(
                title=dict(text="Deal Success Rate", font=dict(size=14, color="white")),
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                yaxis_range=[0, 120],
                yaxis_title="%",
                height=300,
                margin=dict(l=20, r=20, t=40, b=40),
                font=dict(family="Inter"),
            )
            st.plotly_chart(fig, use_container_width=True)

        with col2:
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=[STRATEGIES[r["strategy"]]["label"] if r["strategy"] in STRATEGIES else r["strategy"]
                   for r in batch_results],
                y=[r["avg_pareto"] for r in batch_results],
                marker_color=["#4ECDC4", "#FF6B6B", "#6C63FF"],
                text=[f'{r["avg_pareto"]:.0f}%' for r in batch_results],
                textposition="outside",
                textfont=dict(color="white", size=14),
            ))
            fig.update_layout(
                title=dict(text="Pareto Efficiency", font=dict(size=14, color="white")),
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                yaxis_range=[0, 120],
                yaxis_title="%",
                height=300,
                margin=dict(l=20, r=20, t=40, b=40),
                font=dict(family="Inter"),
            )
            st.plotly_chart(fig, use_container_width=True)

    except ValueError as e:
        st.error(f"⚠️ Configuration Error: {e}")
    except Exception as e:
        st.error(f"❌ Error during batch simulation: {e}")
        st.exception(e)


else:
    # ── Landing State ─────────────────────────────────────────────────────
    st.markdown("")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown(
            '<div class="metric-card">'
            '<div style="font-size:2rem; margin-bottom:0.5rem;">📦</div>'
            '<div class="metric-label">Shipper Agent</div>'
            '<div style="color:rgba(255,255,255,0.7); font-size:0.85rem; margin-top:0.5rem;">'
            'Optimizes cost & speed for cargo delivery'
            '</div></div>',
            unsafe_allow_html=True,
        )

    with col2:
        st.markdown(
            '<div class="metric-card">'
            '<div style="font-size:2rem; margin-bottom:0.5rem;">🚚</div>'
            '<div class="metric-label">Carrier Agent</div>'
            '<div style="color:rgba(255,255,255,0.7); font-size:0.85rem; margin-top:0.5rem;">'
            'Maximizes revenue while managing fleet capacity'
            '</div></div>',
            unsafe_allow_html=True,
        )

    with col3:
        st.markdown(
            '<div class="metric-card">'
            '<div style="font-size:2rem; margin-bottom:0.5rem;">🏭</div>'
            '<div class="metric-label">Warehouse Agent</div>'
            '<div style="color:rgba(255,255,255,0.7); font-size:0.85rem; margin-top:0.5rem;">'
            'Coordinates storage and handling logistics'
            '</div></div>',
            unsafe_allow_html=True,
        )

    st.markdown("")
    st.markdown(
        '<div style="text-align:center; color: rgba(255,255,255,0.4); padding: 2rem;">'
        '👈 Configure your simulation in the sidebar and click <strong>Start Negotiation</strong>'
        '</div>',
        unsafe_allow_html=True,
    )

    # How it works
    st.markdown('<div class="section-header">🧬 How It Works</div>', unsafe_allow_html=True)

    how_cols = st.columns(4)
    steps = [
        ("1️⃣", "Initialize", "LLM-powered agents are created with specific roles, constraints, and strategies"),
        ("2️⃣", "Negotiate", "Agents take turns proposing and counter-proposing using natural language"),
        ("3️⃣", "Converge", "Utility functions guide agents toward Pareto-optimal agreements"),
        ("4️⃣", "Analyze", "Results are scored for efficiency, fairness, and outcome quality"),
    ]
    for col, (num, title, desc) in zip(how_cols, steps):
        with col:
            st.markdown(
                f'<div class="metric-card" style="min-height: 140px;">'
                f'<div style="font-size:1.5rem;">{num}</div>'
                f'<div style="color:#6C63FF; font-weight:600; margin: 0.3rem 0;">{title}</div>'
                f'<div style="color:rgba(255,255,255,0.6); font-size:0.8rem;">{desc}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )
