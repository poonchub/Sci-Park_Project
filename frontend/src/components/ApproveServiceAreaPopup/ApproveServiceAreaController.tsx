import { useEffect, useState } from 'react';
import ApproveServiceAreaPopup from './ApproveServiceAreaPopup';
import { UserInterface } from '../../interfaces/IUser';
import { BusinessGroupInterface } from '../../interfaces/IBusinessGroup';
import { GetDocumentOperators, UpdateRequestServiceAreaStatus, GetServiceAreaDetailsByID, CreateServiceAreaApproval } from '../../services/http';

interface Props {
    open: boolean;
    onClose: () => void;
    requestId: number | null;
    businessGroupId: number | null;
    businessGroups: BusinessGroupInterface[];
    onApproved?: () => Promise<void> | void;
    companyName?: string; // optional from parent for immediate display
}

export default function ApproveServiceAreaController({ open, onClose, requestId, businessGroupId, businessGroups, onApproved, companyName: initialCompanyName }: Props) {
    const [operators, setOperators] = useState<UserInterface[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [companyName, setCompanyName] = useState<string | undefined>(initialCompanyName);
    const [purpose, setPurpose] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchOps = async () => {
            try {
                const res = await GetDocumentOperators();
                if (res) setOperators(res);
                
            } catch (e) {
                console.error('Error fetching document operators', e);
            }
        };
        fetchOps();
    }, []);

    // Update local company name if parent provides/changes it
    useEffect(() => {
        if (initialCompanyName) setCompanyName(initialCompanyName);
    }, [initialCompanyName]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!requestId) return;
            try {
                const details = await GetServiceAreaDetailsByID(requestId);
                console.log('[ApproveServiceAreaController] details fetched:', details);
                // Support both nested and flat response shapes
                const nameFromDetails = details?.AboutCompany?.CompanyName ?? details?.CompanyName;
                const purposeFromDetails = details?.RequestServiceArea?.PurposeOfUsingSpace ?? details?.PurposeOfUsingSpace;
                setCompanyName(nameFromDetails || undefined);
                setPurpose(purposeFromDetails || undefined);
            } catch (e) {
                console.error('Error fetching service area details', e);
            }
        };
        fetchDetails();
    }, [requestId]);

    const handleConfirm = async () => {
        if (!requestId || !selectedOperator) return;
        try {
            setIsSubmitting(true);
            // Create approval audit record with current user ID
            const approverId = Number(localStorage.getItem('userId')) || 0;
            if (approverId) {
                await CreateServiceAreaApproval({ user_id: approverId, request_service_area_id: requestId, operator_user_id: selectedOperator });
            }
            // Update status to Approved
            await UpdateRequestServiceAreaStatus(requestId, 3);
            if (onApproved) await onApproved();
            setSelectedOperator(0);
            onClose();
        } catch (e) {
            console.error('Error approving request', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ApproveServiceAreaPopup
            open={open}
            onClose={() => { setSelectedOperator(0); onClose(); }}
            onConfirm={handleConfirm}
            requestSelected={{ BusinessGroupID: businessGroupId }}
            companyName={companyName}
            purposeOfUsingSpace={purpose}
            selectedOperator={selectedOperator}
            setSelectedOperator={setSelectedOperator}
            operators={operators}
            businessGroups={businessGroups}
            buttonActive={isSubmitting}
        />
    );
}

