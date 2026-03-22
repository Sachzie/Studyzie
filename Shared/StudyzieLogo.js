import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

const StudyzieLogo = ({ size = 100, color = "#103B28" }) => {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
      >
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor="#166534" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        
        {/* Background Circle */}
        <Circle cx="50" cy="50" r="48" fill="white" stroke={color} strokeWidth="2" />
        
        {/* Stylized Book/Notebook shape */}
        <Rect x="30" y="30" width="40" height="50" rx="4" fill="url(#grad)" />
        
        {/* Notebook Spiral details */}
        <Circle cx="35" cy="38" r="2" fill="white" />
        <Circle cx="35" cy="48" r="2" fill="white" />
        <Circle cx="35" cy="58" r="2" fill="white" />
        <Circle cx="35" cy="68" r="2" fill="white" />
        
        {/* Pencil Shape */}
        <Path
          d="M75 25 L85 35 L55 65 L45 65 L45 55 L75 25 Z"
          fill="#FBBF24" // Pencil yellow
          stroke="#B45309"
          strokeWidth="1"
        />
        {/* Pencil Tip */}
        <Path
          d="M45 65 L48 62 L48 65 L45 65 Z"
          fill="black"
        />
        
        {/* "S" for Studyzie */}
        <Path
          d="M42 45 Q50 40 58 45 Q62 50 50 55 Q38 60 50 65 Q58 70 65 65"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

export default StudyzieLogo;
