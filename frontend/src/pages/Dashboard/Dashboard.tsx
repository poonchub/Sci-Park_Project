import { useState } from 'react'
import AlertGroup from '../../components/AlertGroup/AlertGroup';
import { Grid2, Typography } from '@mui/material';

function Dashboard() {

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    return (
        <div className="dashboard-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <Grid2 container spacing={2}>

                {/* Header Section */}
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        แดชบอร์ด
                    </Typography>
                </Grid2>

            </Grid2>
        </div>
    )
}
export default Dashboard;