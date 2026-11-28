import { AppRouter } from './routes/AppRouter';
import { useAuth } from './hooks/useAuth';

export function App() {
  const { authStatus } = useAuth();

  if (authStatus === 'loading') {
    return (
      <div role="status" aria-live="polite">
        <div />
        <p>Loading...</p>
      </div>
    );
  }

  return <AppRouter />;
}

export default App;