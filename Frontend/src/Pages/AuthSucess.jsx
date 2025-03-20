// components/AuthSuccess.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store the token (e.g., in localStorage or a state management solution)
      localStorage.setItem('token', token);
      console.log('Token saved:', token);
      // Redirect to your main app page
      navigate('/dashboard'); // Adjust this path as needed
    } else {
      console.error('No token found in URL');
      navigate('/login'); // Redirect to login if something goes wrong
    }
  }, [navigate, searchParams]);

  return <div>Processing authentication...</div>;
}

export default AuthSuccess;