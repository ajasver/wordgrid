import React from 'react';
import { Button } from "@/components/ui/button";

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  usedLetters: {[key: string]: string};
}

const CustomKeyboard: React.FC<CustomKeyboardProps> = ({ onKeyPress, usedLetters }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
  ];

  const getKeyColor = (key: string) => {
    if (key === 'ENTER' || key === '⌫') return 'bg-gray-600';
    switch (usedLetters[key]) {
      case 'correct': return 'bg-green-600';
      case 'present': return 'bg-yellow-600';
      case 'absent': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 p-2 border-t border-gray-800">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center mb-2">
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`mx-0.5 text-sm ${getKeyColor(key)}`}
              style={{ minWidth: key === 'ENTER' ? '60px' : '30px', height: '40px' }}
            >
              {key}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CustomKeyboard;