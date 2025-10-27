import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Users } from 'lucide-react';
import { getFirebaseDatabase } from '../firebase';
import './LiveScoreboard.css';

const LiveScoreboard = () => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Initialize Firebase and listen to match updates
    const initFirebase = async () => {
      try {
        const { database, ref, onValue } = await getFirebaseDatabase();
        
        // Listen to match updates
        const matchRef = ref(database, 'matches/current');
        const unsubscribe = onValue(matchRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setMatchData(data);
            setLoading(false);
          } else {
            setError('No active match');
            setLoading(false);
          }
        }, (error) => {
          console.error('Firebase error:', error);
          setError('Failed to load match data');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Firebase initialization error:', err);
        setError('Failed to connect to live data');
        setLoading(false);
      }
    };

    initFirebase();
  }, []);

  if (loading) {
    return (
      <div className="live-scoreboard-loading">
        <p>Loading scoreboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="live-scoreboard-error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="live-scoreboard-empty">
        <p>No active match at the moment</p>
      </div>
    );
  }

  const teamAPlayers = Object.entries(matchData.players || {}).filter(([_, player]) => player.team === 'A');
  const teamBPlayers = Object.entries(matchData.players || {}).filter(([_, player]) => player.team === 'B');

  return (
    <motion.div
      className="live-scoreboard-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Match Status */}
      <div className="match-status-bar">
        <div className={`status-indicator ${matchData.isRunning ? 'live' : 'paused'}`}>
          {matchData.isRunning ? '● LIVE' : '⏸ PAUSED'}
        </div>
        <div className={`match-quarter ${matchData.isOvertime ? 'overtime' : ''}`}>
          {matchData.isOvertime ? `OVERTIME ${matchData.quarter - 4}` : `Quarter ${matchData.quarter}`}
        </div>
      </div>

      {/* Main Scoreboard */}
      <div className="scoreboard-main">
        {/* Team A */}
        <div className="team-section">
          <h3 className="team-name">{matchData.teamA}</h3>
          <div className="team-score">{matchData.scoreA || 0}</div>
        </div>

        {/* Timer & VS */}
        <div className="scoreboard-center">
          <div className="game-timer">
            <Clock size={24} />
            <span>{matchData.timerSeconds !== undefined ? formatTime(matchData.timerSeconds) : '12:00'}</span>
          </div>
          <div className="vs-text">VS</div>
        </div>

        {/* Team B */}
        <div className="team-section">
          <h3 className="team-name">{matchData.teamB}</h3>
          <div className="team-score">{matchData.scoreB || 0}</div>
        </div>
      </div>

      {/* Player Stats */}
      <div className="player-stats-container">
        {/* Team A Players */}
        <div className="team-players">
          <h4 className="players-title">
            <Users size={20} />
            {matchData.teamA} Players
          </h4>
          <div className="players-list">
            {teamAPlayers.length > 0 ? (
              teamAPlayers.map(([id, player]) => (
                <div key={id} className="player-card">
                  <span className="player-name">{player.name || 'Player'}</span>
                  <div className="player-stats">
                    <span className="points">{player.points || 0} pts</span>
                    <span className="fouls">{player.fouls || 0} fouls</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-players">No players added yet</div>
            )}
          </div>
        </div>

        {/* Team B Players */}
        <div className="team-players">
          <h4 className="players-title">
            <Users size={20} />
            {matchData.teamB} Players
          </h4>
          <div className="players-list">
            {teamBPlayers.length > 0 ? (
              teamBPlayers.map(([id, player]) => (
                <div key={id} className="player-card">
                  <span className="player-name">{player.name || 'Player'}</span>
                  <div className="player-stats">
                    <span className="points">{player.points || 0} pts</span>
                    <span className="fouls">{player.fouls || 0} fouls</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-players">No players added yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Quarter Scores */}
      {matchData.quarterScores && (
        <div className="quarter-scores-display">
          <h4>Quarter Scores</h4>
          <div className="quarters-grid">
            {[1, 2, 3, 4].map(q => {
              const qKey = `q${q}`;
              const qScore = matchData.quarterScores[qKey] || { teamA: 0, teamB: 0 };
              return (
                <div key={q} className={`quarter-box ${matchData.quarter === q ? 'current-quarter' : ''}`}>
                  <div className="quarter-num">Q{q}</div>
                  <div className="quarter-result">
                    {qScore.teamA} - {qScore.teamB}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LiveScoreboard;
