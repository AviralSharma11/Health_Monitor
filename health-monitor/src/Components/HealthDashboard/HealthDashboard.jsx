"use client";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import rules from "../../Data/DiseaseCriteria";
import "./HealthDashboard.css";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

// ----------------------------
// FIREBASE CONFIG
// ----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyA4oTUU5m5I__8Sbi0n7nn5WW310WTF_zs",
  authDomain: "health-monitoring-systm-6ride9.firebaseapp.com",
  databaseURL: "https://health-monitoring-systm-6ride9-default-rtdb.firebaseio.com",
  projectId: "health-monitoring-systm-6ride9",
  storageBucket: "health-monitoring-systm-6ride9.firebasestorage.app",
  messagingSenderId: "387293100201",
  appId: "1:387293100201:web:382e6327bb9fad897611b8",
  measurementId: "G-KMPPY4Q0M3",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// --------------------------------------------------
// MAIN DASHBOARD COMPONENT
// --------------------------------------------------
export default function HealthDashboard() {
  const [data, setData] = useState({
    heartRate: 0,
    spo2: 0,
    temperature: 0,
    lungSound: 0,
    disease: "None detected",
    riskLevel: "Low",
    doctorAdvice: { advice: "Minor irregularities detected. Monitor your health regularly.", urgency: "None" },
    matches: [],
  });

const [analysisReady, setAnalysisReady] = useState(false);
const [timerStarted, setTimerStarted] = useState(false);


  const [history, setHistory] = useState({
    time: [],
    heartRate: [],
    spo2: [],
    temperature: [],
  });

  const [userInput, setUserInput] = useState({
    height: 170,
    weight: 68,
  });

  function handleInputChange(e) {
    const { name, value } = e.target;
    setUserInput((prev) => ({ ...prev, [name]: value }));
  }

  // --------------------------------------------------
  // REAL-TIME FIREBASE LISTENER
  // --------------------------------------------------
  useEffect(() => {
    const dataRef = ref(db, "/SensorData");

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) return;

      // Extract real Firebase fields
      const latest = {
        bpm: val.bpm ?? 0,
        spo2: val.spo2 ?? 0,
        temp: val.temp ?? 0,
        heartSound: val.heartSound ?? 0,
        height: parseFloat(userInput.height),
        weight: parseFloat(userInput.weight),
      };


      if (!timerStarted) {
        setTimerStarted(true);
        setTimeout(() => {
          setAnalysisReady(true);
        }, 60000); // 1 minute
}

      const analysis = analyzeHealth(latest);

      setData({
        heartRate: latest.bpm,
        spo2: latest.spo2,
        temperature: latest.temp.toFixed(1),
        lungSound: latest.heartSound,
        disease: analysis.disease,
        riskLevel: analysis.riskLevel,
        doctorAdvice: analysis.doctorAdvice,
        matches: analysis.matches,
      });

      setHistory((prev) => ({
        time: [...prev.time.slice(-19), new Date().toLocaleTimeString()],
        heartRate: [...prev.heartRate.slice(-19), latest.bpm],
        spo2: [...prev.spo2.slice(-19), latest.spo2],
        temperature: [...prev.temperature.slice(-19), latest.temp],
      }));
    });

    return () => off(dataRef); // cleanup listener
  }, [userInput.height, userInput.weight]);

  // --------------------------------------------------
  // RULE EVALUATION HELPERS
  // --------------------------------------------------
  function evaluateRule(value, ruleString) {
    if (!ruleString) return false;

    if (ruleString.includes("-")) {
      const [min, max] = ruleString.split("-").map(Number);
      return value >= min && value <= max;
    }
    if (ruleString.startsWith(">=")) return value >= Number(ruleString.slice(2));
    if (ruleString.startsWith(">")) return value > Number(ruleString.slice(1));
    if (ruleString.startsWith("<=")) return value <= Number(ruleString.slice(2));
    if (ruleString.startsWith("<")) return value < Number(ruleString.slice(1));

    const num = Number(ruleString);
    return !isNaN(num) ? value === num : false;
  }

  // --------------------------------------------------
  // DOCTOR RECOMMENDATION ENGINE
  // --------------------------------------------------
  function getDoctorRecommendation(matches, abnormalParams) {
    if (!matches.length) {
      return { advice: "You appear healthy.", urgency: "None" };
    }

    const top = matches[0];

    if (top.disease.toLowerCase().includes("healthy")) {
      return { advice: "You are healthy. Keep maintaining good habits!", urgency: "None" };
    }

    if (top.riskLevel === "High" || top.matchPercent >= 70) {
      return {
        advice: `Possible serious condition (${top.disease}). Consult a doctor immediately.`,
        urgency: "Immediate",
      };
    }

    if (top.riskLevel === "Medium" && top.matchPercent >= 50) {
      return {
        advice: `Some signs of ${top.disease}. Consider a check-up.`,
        urgency: "Soon",
      };
    }

    if (Object.keys(abnormalParams).length > 1) {
      return {
        advice: "Multiple readings slightly off. Routine check-up advised.",
        urgency: "Soon",
      };
    }

    return {
      advice: "Minor irregularities. Monitor regularly.",
      urgency: "Low",
    };
  }

  // --------------------------------------------------
  // MAIN HEALTH ANALYZER
  // --------------------------------------------------
  function analyzeHealth(d) {
    const { bpm, spo2, temp, heartSound, height, weight } = d;

    const bmi = weight && height ? weight / ((height / 100) ** 2) : null;
    const abnormalParams = {};
    const matches = [];

    if (bpm < 60 || bpm > 100) abnormalParams.bpm = bpm;
    if (spo2 < 95) abnormalParams.spo2 = spo2;
    if (temp > 38 || temp < 35.5) abnormalParams.temp = temp;

    if (bmi && (bmi < 18.5 || bmi > 25)) abnormalParams.bmi = bmi;
    if (heartSound !== 0) abnormalParams.heartSound = heartSound;

    let lungSoundLevel = heartSound;  

    // --- Standardized Lung Sound Classification ---
    let lungStatus = "Normal";

    if (lungSoundLevel > 70) lungStatus = "Severe crackles/wheezing (High)";
    else if (lungSoundLevel > 40) lungStatus = "Abnormal breath sounds (Medium)";
    else if (lungSoundLevel > 10) lungStatus = "Mild irregularities (Low)";
    else lungStatus = "Clear / Normal";

    if (lungSoundLevel > 40) abnormalParams.lungSound = lungSoundLevel;

    // Match with rule-based conditions
    for (const cond of rules.conditions) {
      let matched = 0;
      const total = Object.keys(cond.rules).length;

      for (const [key, ruleString] of Object.entries(cond.rules)) {
        let value = null;

        if (key === "bmi") value = bmi;
        else if (key === "heartRate") value = bpm;
        else if (key === "temperature") value = temp;
        else if (key === "spo2") value = spo2;
        else if (key === "lungSound") value = lungSoundLevel;

        if (evaluateRule(value, ruleString)) matched++;
      }

      if (matched > 0) {
        matches.push({
          disease: cond.name,
          description: cond.description,
          riskLevel: cond.risk,
          matchPercent: Math.round((matched / total) * 100),
        });
      }
    }

    matches.sort((a, b) => b.matchPercent - a.matchPercent);

    const topMatch = matches[0] || {
      disease: "Healthy / Normal",
      description: "All readings normal.",
      riskLevel: "Low",
    };

    const doctorAdvice = getDoctorRecommendation(matches, abnormalParams);

    return {
      disease: topMatch.disease,
      riskLevel: topMatch.riskLevel,
      description: topMatch.description,
      bmi: bmi ? bmi.toFixed(1) : null,
      matches,
      abnormalParams,
      doctorAdvice,
      lungStatus,
      lungSound: lungSoundLevel,

    };
  }

  // --------------------------------------------------
  // CHART DATA
  // --------------------------------------------------
  const chartData = (label, dataset) => ({
    labels: history.time,
    datasets: [
      {
        label,
        data: dataset,
        borderColor: "rgb(75, 192, 192)",
        fill: false,
        tension: 0.3,
      },
    ],
  });


  function simulateData() {
  const randomData = {
    heartRate: Math.floor(Math.random() * (120 - 60) + 60),  // 60–120 BPM
    spo2: Math.floor(Math.random() * (100 - 85) + 85),       // 85–100%
    temperature: (Math.random() * (39 - 36) + 36).toFixed(1), // 36–39°C
    lungSound: Math.floor(Math.random() * (90 - 30) + 30),   // 30–90 dB
    age: 25,
    height: parseFloat(userInput.height),
    weight: parseFloat(userInput.weight)
  };

    // Analyze health with your rule system
  const {
    disease,
    riskLevel,
    description,
    bmi,
    matches,
    doctorAdvice,
  } = analyzeHealth(randomData);

  //Include matches in setData
  setData({
    ...randomData,
    disease,
    description,
    riskLevel,
    doctorAdvice,
    matches, 
    healthStatus:
      riskLevel === "High"
        ? "Critical"
        : riskLevel === "Medium"
        ? "Warning"
        : "Normal",
  });

  // Update chart history
  setHistory((prev) => ({
    time: [...prev.time, new Date().toLocaleTimeString()],
    heartRate: [...prev.heartRate, randomData.heartRate],
    spo2: [...prev.spo2, randomData.spo2],
    temperature: [...prev.temperature, randomData.temperature],
  }));

  console.log("Simulated Data:", randomData);
}

  // --------------------------------------------------
  // JSX RETURN (UI)
  // --------------------------------------------------
  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Smart Health Monitor Dashboard</h1>
            <div className="button-group">
            <button className="simulate-btn" onClick={simulateData}>Simulate Random Data</button>
          </div>
      {/* User Inputs */}
      <div className="user-inputs">
        <h3>Enter Your Details</h3>
        <div className="input-group">
          <label>Height (cm):</label>
          <input type="number" name="height" value={userInput.height} onChange={handleInputChange} />
        </div>

        <div className="input-group">
          <label>Weight (kg):</label>
          <input type="number" name="weight" value={userInput.weight} onChange={handleInputChange} />
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="sensor-grid">
        <SensorCard title="Heart Rate" value={`${data.heartRate} BPM`} color="red" />
        <SensorCard title="SpO₂" value={`${data.spo2} %`} color="blue" />
        <SensorCard title="Temperature" value={`${data.temperature} °C`} color="orange" />
        <SensorCard title="Sound Level" value={`${data.lungSound} dB`} color="green" />
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <ChartCard title="Heart Rate Over Time" data={chartData("Heart Rate", history.heartRate)} />
        <ChartCard title="SpO₂ Over Time" data={chartData("SpO₂", history.spo2)} />
        <ChartCard title="Temperature Over Time" data={chartData("Temperature", history.temperature)} />
      </div>

      {/* AI Analysis */}
      <motion.div className="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2>AI Health Analysis</h2>

        <div className="analysis-content">

         <div className="analysis-right">
  <h3>Possible Conditions:</h3>

  {!analysisReady ? (
    <p><em>Analyzing your health data… Please wait 1 minute.</em></p>
  ) : data.matches.length ? (
    <ul>
      {data.matches.map((m, i) => (
        <li key={i}>
          <strong>{m.disease}</strong> — {m.matchPercent}% ({m.riskLevel})
        </li>
      ))}
    </ul>
  ) : (
    <p>Healthy</p>
  )}
</div>

<div className="analysis-right">
  <h3>Doctor Recommendation:</h3>

  {!analysisReady ? (
    <p><em>Generating doctor recommendation…</em></p>
  ) : (
    <>
      <p><strong>Urgency:</strong> {data.doctorAdvice.urgency}</p>
      <p>{data.doctorAdvice.advice}</p>
    </>
  )}
</div>

        </div>
      </motion.div>
    </div>
  );
}

// --------------------------------------------------
// SMALL COMPONENTS
// --------------------------------------------------
function SensorCard({ title, value, color }) {
  return (
    <motion.div className={`sensor-card ${color}`} whileHover={{ scale: 1.05 }}>
      <h3>{title}</h3>
      <p className="sensor-value">{value}</p>
    </motion.div>
  );
}

function ChartCard({ title, data }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <Line data={data} />
    </div>
  );
}
