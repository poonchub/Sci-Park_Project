import { Grid } from "@mui/system";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

export default function CustomTabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<Grid 
			size={{ xs: 12, md: 12 }} 
			sx={{ 
				display: (value !== index) ? 'none' : '',
			}}
		>
			<div
				role="tabpanel"
				id={`full-width-tabpanel-${index}`}
				aria-labelledby={`full-width-tab-${index}`}
				{...other}
			>
				{value === index && (
					<Grid
                        minHeight={'200px'}
					>
						{children}
					</Grid>
				)}
			</div>
		</Grid>

	);
}