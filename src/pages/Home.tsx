import React from 'react';
import Button from '../components/atoms/Button/Button';

const Home: React.FC = () => {
  return (
    <div>
      <h1>Welcome to Nazdeeq</h1>
      <Button text="Get Started" onClick={() => console.log('Clicked!')} />
    </div>
  );
};

export default Home;