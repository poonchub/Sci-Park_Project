import React, { useState } from 'react';
import { Typography,  Box } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
    text: string;
    maxLines?: number;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLines = 3 }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Box
            sx={{
                display: 'flex'
            }}
        >
            <Typography
                sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: expanded ? 'unset' : maxLines,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.8em',
                    fontSize: 14,
                    color: 'text.secondary',
                    whiteSpace: "pre-line"
                }}
            >
                {text}
            </Typography>

            {text.length > 100 && (
                <Box
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? (
                        <ChevronUp />
                    ) : <ChevronDown />}
                </Box>
            )}
        </Box>
    );
};

export default ExpandableText;