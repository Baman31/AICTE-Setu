import LoginPage from '../LoginPage';
import { useLocation } from 'wouter';

export default function LoginPageExample() {
  const [, setLocation] = useLocation();

  return (
    <LoginPage
      onLogin={(role, email) => {
        console.log('Logged in as:', role, email);
        setLocation(`/${role}/dashboard`);
      }}
    />
  );
}
