import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Dialog from '@material-ui/core/Dialog';
import Table from '@material-ui/core/Table';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
import CropFreeIcon from '@material-ui/icons/CropFree';
import { useRedeemableCodeService } from 'contexts';
import PATHS from '../paths';
import './RedeemableCodeTabContent.css';

const baseUrl = process.env.PUBLIC_URL || 'http://localhost:4000';

function QRCodeDialog({
  open,
  code,
  onClose,
}: {
  open: boolean;
  code: string;
  onClose: () => void;
}) {
  const codeUrl = new URL(`${PATHS.PROMO_CODE}?code=${code}`, baseUrl);
  return (
    <Dialog
      classes={{
        root: 'opaque-dialog',
      }}
      fullWidth
      open={open}
      onClose={onClose}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
        }}
      >
        <IconButton style={{ marginBottom: '1rem' }} onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <QRCode size={256} value={codeUrl.href} />
      </div>
    </Dialog>
  );
}

export default function RedeemableCodeTabContent() {
  const [
    redeemableCodeState,
    redeemableCodeService,
  ] = useRedeemableCodeService();
  const [displayedQrCode, setDisplayedQrCode] = useState('');

  const redeemableCodes = redeemableCodeState?.codes ?? [];

  useEffect(() => {
    if (redeemableCodeService) {
      redeemableCodeService.refreshRedeemableCodes();
    }
  }, [redeemableCodeService]);

  const createFacebookDormCode = () =>
    redeemableCodeService?.createRedeemableCode();

  return (
    <>
      <Typography variant="h5" component="h2" style={{ margin: '8px' }}>
        Promo codes
      </Typography>
      <Button
        value="submit"
        variant="contained"
        color="primary"
        size="small"
        onClick={createFacebookDormCode}
      >
        Create code
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>QR</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {redeemableCodes.map((redeemableCode) => (
              <TableRow key={redeemableCode.id}>
                <TableCell>{redeemableCode.code}</TableCell>
                <TableCell>
                  <IconButton
                    role="button"
                    onClick={() => setDisplayedQrCode(redeemableCode.code)}
                  >
                    <CropFreeIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{redeemableCode.redemptionLimit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <QRCodeDialog
        open={Boolean(displayedQrCode)}
        code={displayedQrCode}
        onClose={() => setDisplayedQrCode('')}
      />
    </>
  );
}
