const rules ={
  "conditions": [
    {
      "name": "Fever / Infection",
      "risk": "High",
      "rules": {
        "heartRate": ">100",
        "temperature": ">38"
      },
      "description": "Elevated heart rate and high body temperature indicate possible infection or fever."
    },
    {
      "name": "Severe Fever / Heat Stroke",
      "risk": "High",
      "rules": {
        "temperature": ">39",
        "heartRate": ">120"
      },
      "description": "Extreme temperature and high pulse can indicate heat stroke or severe infection."
    },
    {
      "name": "Hypothermia",
      "risk": "High",
      "rules": {
        "temperature": "<35",
        "heartRate": "<50"
      },
      "description": "Low temperature and bradycardia suggest hypothermia or metabolic slowing."
    },
    {
      "name": "Bradycardia",
      "risk": "Medium",
      "rules": {
        "heartRate": "<50",
        "temperature": ">=35"
      },
      "description": "Resting heart rate lower than 50 bpm in non-athletes may indicate sinus bradycardia."
    },
    {
      "name": "Tachycardia",
      "risk": "Medium",
      "rules": {
        "heartRate": ">100",
        "temperature": "<38"
      },
      "description": "Fast heart rate with normal temperature could be due to anxiety, dehydration, or cardiac stress."
    },
    {
      "name": "Asthma",
      "risk": "Medium",
      "rules": {
        "lungSound": ">60",
        "spo2": "<95"
      },
      "description": "Wheezing lung sounds and reduced oxygen saturation indicate possible asthma attack."
    },
    {
      "name": "Bronchitis",
      "risk": "Medium",
      "rules": {
        "lungSound": ">55",
        "spo2": "<94",
        "temperature": "37.5-38.5"
      },
      "description": "Crackling or coarse breath sounds with mild fever indicate bronchitis."
    },
    {
      "name": "Pneumonia",
      "risk": "High",
      "rules": {
        "lungSound": ">65",
        "spo2": "<92",
        "temperature": ">38"
      },
      "description": "Low oxygen levels and high fever with lung crackles suggest pneumonia or severe lung infection."
    },
    {
      "name": "COPD (Chronic Obstructive Pulmonary Disease)",
      "risk": "High",
      "rules": {
        "spo2": "<90",
        "lungSound": ">60",
        "age": ">50"
      },
      "description": "Persistently low oxygen and abnormal lung sounds in older patients suggest COPD."
    },
    {
      "name": "COVID-like Viral Pneumonia",
      "risk": "High",
      "rules": {
        "spo2": "<93",
        "temperature": ">38",
        "lungSound": ">65"
      },
      "description": "Combination of low SpO₂, high temperature, and crackling lung sounds resembles viral pneumonia or COVID-like infection."
    },
    {
      "name": "Hypoxia / Respiratory Distress",
      "risk": "High",
      "rules": {
        "spo2": "<92",
        "heartRate": ">100"
      },
      "description": "Low oxygen levels with tachycardia indicate oxygen deprivation or respiratory distress."
    },
    {
      "name": "Pulmonary Edema",
      "risk": "High",
      "rules": {
        "lungSound": ">70",
        "spo2": "<90"
      },
      "description": "Crackling lung sounds and low oxygen may indicate fluid in lungs (edema)."
    },
    {
      "name": "Cardiac Arrhythmia",
      "risk": "High",
      "rules": {
        "heartRate": "irregular"
      },
      "description": "Irregular heart rate pattern suggests possible arrhythmia or atrial fibrillation."
    },
    {
      "name": "Hypertension (Early Cardiac Risk)",
      "risk": "Medium",
      "rules": {
        "heartRate": ">90",
        "bmi": ">30",
        "age": ">40"
      },
      "description": "High BMI and elevated resting HR suggest increased risk of hypertension."
    },
    {
      "name": "Obesity / Metabolic Syndrome",
      "risk": "Medium",
      "rules": {
        "bmi": ">30"
      },
      "description": "High BMI increases the risk of diabetes, hypertension, and cardiac issues."
    },
    {
      "name": "Underweight / Malnutrition",
      "risk": "Medium",
      "rules": {
        "bmi": "<18.5"
      },
      "description": "Low BMI with high heart rate can indicate nutritional deficiency or anemia."
    },
    {
      "name": "Anemia",
      "risk": "Medium",
      "rules": {
        "spo2": "94-97",
        "heartRate": ">100",
        "bmi": "<20"
      },
      "description": "Mildly low oxygen saturation and high HR in low BMI individuals may indicate anemia."
    },
    {
      "name": "Dehydration / Heat Fatigue",
      "risk": "Medium",
      "rules": {
        "temperature": "37.5-38",
        "heartRate": ">100"
      },
      "description": "Slight fever and tachycardia can indicate dehydration or heat exhaustion."
    },
    {
      "name": "Hypothyroidism",
      "risk": "Medium",
      "rules": {
        "heartRate": "<60",
        "temperature": "<36"
      },
      "description": "Low HR and low body temperature suggest reduced thyroid function."
    },
    {
      "name": "Stress / Anxiety Attack",
      "risk": "Low",
      "rules": {
        "heartRate": ">100",
        "temperature": "<37.5",
        "spo2": ">95"
      },
      "description": "Elevated heart rate with normal oxygen and temperature indicates stress response."
    },
    {
      "name": "Sleep Apnea (Risk)",
      "risk": "Medium",
      "rules": {
        "spo2": "<90",
        "bmi": ">28"
      },
      "description": "Periodic drops in oxygen levels during rest indicate sleep apnea risk."
    },
    {
      "name": "Cardiac Insufficiency / Heart Failure",
      "risk": "High",
      "rules": {
        "spo2": "<90",
        "heartRate": ">100",
        "age": ">60"
      },
      "description": "Elderly patient with low oxygen and high HR could indicate early heart failure."
    },
    {
      "name": "Heat Stroke",
      "risk": "High",
      "rules": {
        "temperature": ">40",
        "heartRate": ">120"
      },
      "description": "Very high body temperature and HR indicate dangerous heat stroke."
    },
    {
      "name": "Common Cold / Mild Infection",
      "risk": "Low",
      "rules": {
        "temperature": "37.3-38",
        "spo2": ">95",
        "lungSound": "<55"
      },
      "description": "Slight fever and mild cough with normal oxygen indicate common cold."
    },
    {
      "name": "Influenza (Flu)",
      "risk": "Medium",
      "rules": {
        "temperature": "38-39",
        "heartRate": ">100",
        "spo2": "94-97"
      },
      "description": "Moderate fever, elevated HR, and slight oxygen drop suggest influenza."
    },
    {
      "name": "Respiratory Infection (Generic)",
      "risk": "Medium",
      "rules": {
        "temperature": ">37.8",
        "lungSound": ">60"
      },
      "description": "Elevated temperature and lung sound intensity indicate infection."
    },
    {
      "name": "Childhood Fever (Age < 12)",
      "risk": "Medium",
      "rules": {
        "age": "<12",
        "temperature": ">38.5",
        "heartRate": ">120"
      },
      "description": "Children have higher baseline HR; elevated temp indicates fever or infection."
    },
    {
      "name": "Elderly Respiratory Risk",
      "risk": "High",
      "rules": {
        "age": ">65",
        "spo2": "<93",
        "lungSound": ">55"
      },
      "description": "Older adults with low oxygen and lung anomalies may have underlying COPD or pneumonia."
    },
    {
      "name": "Diabetes / Insulin Resistance Risk",
      "risk": "Medium",
      "rules": {
        "bmi": ">28",
        "age": ">40"
      },
      "description": "Overweight adults above 40 are at risk of metabolic disorders like diabetes."
    },
    {
      "name": "Healthy / Normal",
      "risk": "Low",
      "rules": {
        "heartRate": "60-100",
        "temperature": "36-37.5",
        "spo2": "95-100",
        "bmi": "18.5-24.9"
      },
      "description": "All vital signs within normal ranges indicate a healthy condition."
    }
  ]
}

export default rules;