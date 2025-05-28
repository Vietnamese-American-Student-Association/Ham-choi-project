import { useRouter } from 'next/router';

const Dashboard = () => {
    const router = useRouter();
    const { user } = router.query;

    return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <h1>Welcome, {user}!</h1>
            <p>This is your dashboard.</p>
        </div>
    );
};

export default Dashboard;