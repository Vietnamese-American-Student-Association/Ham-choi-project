import { useState } from 'react';
import { useRouter } from 'next/router';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('Username is required');
            return;
        }

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });

        const result = await res.json();

        if (res.ok) {
            router.push(`/leaderboard?user=${encodeURIComponent(result.name)}`);
        } else {
            setError('Login failed');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.heading}>VASA Officer Login</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        style={styles.input}
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" style={styles.button}>Login</button>
                </form>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #ffccbc, #ffe0b2)', // warm Vietnamese colors
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    },
    card: {
        backgroundColor: '#fff8f0',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '32px 24px',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
    },
    heading: {
        fontSize: 24,
        marginBottom: 20,
        color: '#b71c1c', // deep red
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: 12,
        marginBottom: 12,
        borderRadius: 6,
        border: '1px solid #ccc',
        fontSize: 16,
        outline: 'none',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: 12,
        backgroundColor: '#d32f2f', // VASA red
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        fontSize: 16,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.3s ease',
    },
    error: {
        color: '#d32f2f',
        fontSize: 14,
        marginBottom: 12,
    },
};

export default LoginPage;