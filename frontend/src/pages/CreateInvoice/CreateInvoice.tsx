import { Box, Button } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { useState } from "react";
import { handleDownloadInvoice } from "../../utils/handleDownloadInvoice";

function CreateInvoice() {
    const [searchText, setSearchText] = useState<String>()


    return (
        <Box className="create-invoice-page">
            <TextField
                // fullWidth
                className="search-box"
                variant="outlined"
                placeholder="Search"
                margin="none"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />
            <Button 
                variant="outlined"
                // onClick={()=> handleDownloadInvoice(Number(searchText))}
                sx={{ marginLeft: 1 }}
            >
                Dowload PDF
            </Button>
        </Box>

    );
}

export default CreateInvoice;
