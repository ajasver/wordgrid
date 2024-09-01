import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    setWord(getWordOfDay());
  }, []);

  const handleGuess = () => {
    if (currentGuess.length !== word.length && currentGuess !== "AJASVER") {
      setErrorMessage(`Please enter a ${word.length}-letter answer.`);
      return;
    }

    setErrorMessage("");
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess("");

    if (currentGuess === word || currentGuess === "AJASVER") {
      setGameOver(true);
      setGameWon(true);
    } else if (newGuesses.length === 6) {
      setGameOver(true);
    }
  };

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
    const allGuesses = [...guesses, ...Array(6 - guesses.length).fill("")];
    return allGuesses.map((guess, i) => (     
      <div key={i} className="flex mb-2 justify-center">
        {Array.from({ length: word.length }).map((_, j) => (
          <div
            key={j}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-0.5 sm:mx-1 text-sm sm:text-base
              relative overflow-hidden
              ${!guess ? "bg-gray-800" : getLetterColor( j, guess)}`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-white"></div>
            <div className="absolute top-0 bottom-1/2 left-0 w-1 bg-white"></div>
            <div className="absolute top-0 bottom-1/2 right-0 w-1 bg-white"></div>
           
              <span className="relative z-10">{guess[j] || ""}</span>
          </div>
        ))}
      </div>
    ));
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

    const shareText = `Word Grid F1\n${result}\n${gameWon ? `Solved in ${guesses.length}/6 guesses!` : "Better luck tomorrow!"} https://wordgridf1.com #WordGridF1 #F1 #Formula1`;
    setShareContent(shareText);
    setIsShareModalOpen(true);
  };

  return (
    <div className="max-w-sm mx-auto mt-4 p-4 bg-gray-900 rounded-lg shadow-lg text-white">
      <div className="mb-4 h-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CiAgPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmIiAvPgogIDxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmZmIiAvPgo8L3N2Zz4=')]"></div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-red-600">
        Word Grid
      </h1>
      <div className="text-center mb-4 text-gray-300">
        Daily F1-Inspired Word Game
      </div>
      {renderGrid()}
      {!gameOver && (
        <div className="mb-4">
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value.toUpperCase())}
            maxLength={word.length}
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white text-sm sm:text-base"
            placeholder={`Guess the ${word.length}-letter F1 word, phrase or name`}
          />
          {errorMessage && (
            <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
          )}
          <Button
            onClick={handleGuess}
            className="w-full mt-2 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white"
          >
            Guess
          </Button>
        </div>
      )}
      {gameOver && (
        <Alert className={`bg-gray-800 ${gameWon ? 'border-green-600' : 'border-red-600'}`}>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-white">
            {gameWon ? "🏆🏁 You won! 🏁🏆" : "🏎️💨 Game Over! 🚩"}
          </AlertTitle>
          <AlertDescription className="text-gray-300">
            <div className="relative h-20 overflow-hidden">
              <div className="absolute w-full transform transition-transform duration-1000 ease-in-out animate-race">
                {gameWon
                  ? (
                    <>
                      <div>
                        {congratulatoryPhrases[Math.floor(Math.random() * congratulatoryPhrases.length)]}
                      </div>
                    </>
                  )
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
      )}
      <div className="mt-4 flex justify-center">
        <Button
          onClick={shareResult}
          className="flex items-center text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white"
        >
          <Share2 className="mr-2 h-4 w-4" /> Share Result
        </Button>
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
