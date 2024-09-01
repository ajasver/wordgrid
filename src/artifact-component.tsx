import React, { useState, useEffect, useRef, useCallback } from "react";
import { AlertCircle, Share2, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { words, congratulatoryPhrases } from "./constants";
import "./App.css";
import CustomKeyboard from './CustomKeyboard';
import Cookies from 'js-cookie';

const getWordOfDay = (): string => {
  const startDate = new Date("2023-01-01").setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const index = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  return words[index % words.length].toUpperCase();
};

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, content }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="bg-gray-900 text-white">
      <DialogHeader>
        <DialogTitle>Share Your Word Grid Result</DialogTitle>
        <DialogDescription className="text-gray-300">
          Copy the text below to share your game result:
        </DialogDescription>
      </DialogHeader>
      <div className="bg-gray-800 p-4 rounded-md">
        <pre className="whitespace-pre-wrap break-words text-white">
          {content}
        </pre>
      </div>
      <Button
        onClick={() => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(content).then(() => {
              alert("Result copied to clipboard!");
            });
          }
        }}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white"
      >
        <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
      </Button>
    </DialogContent>
  </Dialog>
);

const WordGrid: React.FC = () => {
  const [word, setWord] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareContent, setShareContent] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [usedLetters, setUsedLetters] = useState<{[key: string]: string}>({});
  const [todaysWord, setTodaysWord] = useState<string>("");
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [animationStarted, setAnimationStarted] = useState<boolean>(false);
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  const [congratsMessage, setCongratsMessage] = useState<string>("");

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedGameState = Cookies.get('wordGridGameState');
    
    if (storedGameState) {
      const { date, word, guesses: storedGuesses, gameOver: storedGameOver, gameWon: storedGameWon, usedLetters: storedUsedLetters, timer: storedTimer } = JSON.parse(storedGameState);
      
      if (date === today) {
        setWord(word);
        setGuesses(storedGuesses);
        setGameOver(storedGameOver);
        setGameWon(storedGameWon);
        setTodaysWord(word);
        setUsedLetters(storedUsedLetters || {});
        setTimer(storedTimer || 0);
        setShowKeyboard(true);
        setAnimationComplete(true);
        
        if (!storedGameOver && !storedGameWon) {
          startTimer(storedTimer || 0);
        }
        
        console.log("Existing game loaded, timer resumed");
        return;
      }
    }
    
    const newWord = getWordOfDay();
    setWord(newWord);
    setTodaysWord(newWord);
    Cookies.set('wordGridGameState', JSON.stringify({
      date: today,
      word: newWord,
      guesses: [],
      gameOver: false,
      gameWon: false,
      usedLetters: {}
    }), { expires: 1 });

    console.log("New game started, setting animationStarted to true");
    setAnimationStarted(true);
  }, []);

  useEffect(() => {
    if (animationStarted) {
      console.log("Animation started, calling animateIntro");
      const timeout = setTimeout(() => {
        animateIntro();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [animationStarted]);

  const animateIntro = () => {
    console.log("Animate intro called");
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer) {
      const animationGrid = document.createElement('div');
      animationGrid.className = 'grid animation-grid';
      gridContainer.appendChild(animationGrid);

      for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'flex mb-1 justify-center';
        for (let j = 0; j < word.length; j++) {
          const cell = document.createElement('div');
          cell.className = 'aspect-square m-0.5';
          cell.style.width = `calc((100% - ${word.length + 1}*0.25rem) / ${word.length})`;
          row.appendChild(cell);
        }
        animationGrid.appendChild(row);
      }

      const rows = animationGrid.querySelectorAll('.flex');
      rows.forEach((row, index) => {
        setTimeout(() => {
          row.childNodes.forEach((cell: ChildNode) => {
            (cell as HTMLElement).style.backgroundColor = 'red';
          });
          if (index === rows.length - 1) {
            setTimeout(() => {
              showLightsOutMessage();
            }, 500);
          }
        }, index * 200);
      });
    } else {
      console.log("Grid container not found");
    }
  };

  const showLightsOutMessage = () => {
    console.log("Showing Lights Out message");
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer) {
      const message = document.createElement('div');
      message.textContent = 'Lights Out!';
      message.className = 'text-4xl font-bold text-white absolute inset-0 flex items-center justify-center bg-black bg-opacity-80';
      gridContainer.appendChild(message);

      setTimeout(() => {
        message.remove();
        const animationGrid = document.querySelector('.animation-grid');
        if (animationGrid) {
          animationGrid.remove();
        }
        setAnimationComplete(true);
        setShowKeyboard(true);
        console.log("Animation complete, keyboard shown");
      }, 1500);
    }
  };

  useEffect(() => {
    if (showKeyboard) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showKeyboard]);

  const startTimer = (initialTime: number = 0) => {
    setTimer(initialTime);
    timerRef.current = setInterval(() => {
      setTimer(prevTimer => {
        const newTime = prevTimer + 1;
        updateCookieWithTimer(newTime);
        return newTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    updateCookieWithTimer(timer);
  };

  const updateCookieWithTimer = (currentTime: number) => {
    const storedGameState = Cookies.get('wordGridGameState');
    if (storedGameState) {
      const gameState = JSON.parse(storedGameState);
      gameState.timer = currentTime;
      Cookies.set('wordGridGameState', JSON.stringify(gameState), { expires: 1 });
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleKeyPress = (key: string) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      handleGuess();
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < word.length) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const updateUsedLetters = (guess: string) => {
    const newUsedLetters = { ...usedLetters };
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      const color = getLetterColor(i, guess);
      if (color === 'bg-green-600') {
        newUsedLetters[letter] = 'correct';
      } else if (color === 'bg-yellow-600' && newUsedLetters[letter] !== 'correct') {
        newUsedLetters[letter] = 'present';
      } else if (color === 'bg-red-700' && !newUsedLetters[letter]) {
        newUsedLetters[letter] = 'absent';
      }
    }
    setUsedLetters(newUsedLetters);
  };

  const updateCookieWithGameOver = (isOver: boolean, isWon: boolean) => {
    const storedGameState = Cookies.get('wordGridGameState');
    if (storedGameState) {
      const gameState = JSON.parse(storedGameState);
      gameState.gameOver = isOver;
      gameState.gameWon = isWon;
      Cookies.set('wordGridGameState', JSON.stringify(gameState), { expires: 1 });
    }
  };

  const handleGuess = useCallback(() => {
    if (currentGuess.length !== word.length && currentGuess !== "AJASVER") {
      setErrorMessage(`Please enter a ${word.length}-letter answer.`);
      return;
    }

    setErrorMessage("");
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    updateUsedLetters(currentGuess);
    setCurrentGuess("");

    if (currentGuess === word || currentGuess === "AJASVER") {
      setGameOver(true);
      setGameWon(true);
      stopTimer();
      updateCookieWithGameOver(true, true);
      setCongratsMessage(congratulatoryPhrases[Math.floor(Math.random() * congratulatoryPhrases.length)]);
    } else if (newGuesses.length === 6) {
      setGameOver(true);
      stopTimer();
      updateCookieWithGameOver(true, false);
    }
  }, [currentGuess, word, guesses, stopTimer, updateCookieWithGameOver]);

  const getLetterColor = (index: number, guess: string): string => {

    const wordLetterCount: { [key: string]: number } = {};
    const correctPositions: boolean[] = new Array(word.length).fill(false);
    const correctLetter: boolean[] = new Array(word.length).fill(false);
   
    // First pass: count letters in word and mark correct positions
    for (let i = 0; i < word.length; i++) {
      wordLetterCount[word[i]] = (wordLetterCount[word[i]] || 0) + 1;
    }

    for (let i = 0; i < word.length; i++) {
      if (word[i] === guess[i]) {
        correctPositions[i] = true;
        wordLetterCount[guess[i]]--;
      }
    }
    
    for (let i = 0; i < word.length; i++) {
      if (wordLetterCount[guess[i]] > 0) {
        wordLetterCount[guess[i]]--;
        correctLetter[i] = true;
      }
      else {
        correctLetter[i] = false;
      }
    }
    // If the current letter is in the correct position, return green
    if (correctPositions[index]) return "bg-green-600";

    // Second pass: handle remaining letters
    if (correctLetter[index]) {
      return "bg-yellow-600";
    }

    return "bg-red-700";
  };

  const renderGrid = () => {
    const allGuesses = [...guesses, currentGuess, ...Array(5 - guesses.length).fill("")];
    return (
      <div className="grid">
        {allGuesses.map((guess, i) => (     
          <div 
            key={i} 
            className="flex mb-1 justify-center"
            id={i === guesses.length ? 'current-row' : undefined}
          >
            {Array.from({ length: word.length }).map((_, j) => (
              <div
                key={j}
                className={`aspect-square flex items-center justify-center m-0.5 text-2xl font-bold
                  relative overflow-hidden
                  ${!guess ? "" : 
                    i === guesses.length ? "bg-gray-700" :
                    getLetterColor(j, guess)}`}
                style={{
                  width: `calc((100% - ${word.length + 1}*0.25rem) / ${word.length})`,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-white"></div>
                <div className="absolute top-0 bottom-1/2 left-0 w-1 bg-white"></div>
                <div className="absolute top-0 bottom-1/2 right-0 w-1 bg-white"></div>
               
                <span className="relative z-10">{guess[j] || ""}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const shareResult = () => {
    const result = guesses
      .map((guess) =>
        guess
          .split("")
          .map((_, i) => {
            const color = getLetterColor(i, guess);
            return color === "bg-green-600"
              ? "🟩"
              : color === "bg-yellow-600"
                ? "🟨"
                : "🟥";
          })
          .join(""),
      )
      .join("\n");

    const lapTime = formatTime(timer);
    const shareText = `Word Grid F1\n${result}\n${gameWon ? `Solved in ${guesses.length}/6 guesses!` : "Better luck tomorrow!"}\nLap Time: ${lapTime}\nhttps://wordgridf1.com #WordGridF1 #F1 #Formula1`;
    setShareContent(shareText);
    setIsShareModalOpen(true);
  };

  const renderBottomSection = () => {
    if (gameOver) {
      return (
        <div className="bg-gray-900 p-4 border-t border-gray-800">
          <Alert className={`bg-gray-800 ${gameWon ? 'border-green-600' : 'border-red-600'} mb-4`}>
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-white">
              {gameWon ? "🏆🏁 You won! 🏁🏆" : "🏎️💨 Game Over! 🚩"}
            </AlertTitle>
            <AlertDescription className="text-gray-300">
              <div className="relative h-20 overflow-hidden">
                <div className="absolute w-full transform transition-transform duration-1000 ease-in-out animate-race">
                  {gameWon
                    ? <div>{congratsMessage}</div>
                    : `The answer was ${word}. Better luck tomorrow!`
                        .split(' ')
                        .map((word, index) => (
                          <span
                            key={index}
                            className="inline-block transform transition-all duration-500 ease-in-out"
                            style={{
                              animationDelay: `${index * 0.1}s`,
                            }}
                          >
                            {word}{' '}
                          </span>
                        ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
          <Button
            onClick={shareResult}
            className="w-full flex items-center justify-center text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white"
          >
            <Share2 className="mr-2 h-4 w-4" /> Share Result
          </Button>
        </div>
      );
    } else {
      return (
        <CustomKeyboard onKeyPress={handleKeyPress} usedLetters={usedLetters} />
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-grow overflow-auto p-2">
        <div className="mb-2 h-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CiAgPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmIiAvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmIiAvPgo8L3N2Zz4=')]"></div>
        <h1 className="text-xl font-bold mb-2 text-center text-red-600">
          Word Grid
        </h1>
        {showKeyboard && (
          <div className="text-center mb-2 text-gray-300 text-sm">
            Lap Time: {formatTime(timer)}
          </div>
        )}
        <div className="text-center mb-2 text-gray-300 text-sm">
          Guess the {word.length}-letter F1 word, phrase or name
        </div>
        <div className="grid-container w-full max-w-md mx-auto relative">
          {(!animationStarted || animationComplete) && renderGrid()}
        </div>
        {errorMessage && (
          <p className="text-red-500 text-sm mt-1 text-center">{errorMessage}</p>
        )}
      </div>
      <div className="mt-auto">
        {showKeyboard ? renderBottomSection() : null}
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        content={shareContent}
      />
    </div>
  );
};

export default WordGrid;
