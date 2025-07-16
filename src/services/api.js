import { environment } from '../env/environment';

export const sendToBackend = async (pdfBlob, formData, painDiagramPdf, navigate) => {
  const sendData = new FormData();

  // ✅ Attach required text fields as strings
  sendData.append('firstName', String(formData.firstName || ''));
  sendData.append('lastName', String(formData.lastName || ''));
  sendData.append('email', String(formData.email || ''));
  sendData.append('phone', String(formData.phone || ''));
  sendData.append('postal code', String(formData.postalCode || ''));

  // ✅ Attach PDFs
  if (pdfBlob instanceof Blob) {
    sendData.append('pdf', pdfBlob, 'patient_form.pdf');
  }

  if (painDiagramPdf instanceof File) {
    sendData.append('painDiagramPdf', painDiagramPdf, painDiagramPdf.name);
  }

  // ✅ Debug: Log all fields being sent
  for (let [key, value] of sendData.entries()) {
    console.log(`${key}:`, value);
  }

  const response = await fetch(`${environment.baseUrl}/api/drive/upload-patient-form`, {
    method: 'POST',
    body: sendData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload form: ${response.status}`);
  }

  const result = await response.json();

  if (navigate) {
    navigate('/thank-you', {
      state: { primaryAreaOfConcern: formData.primaryAreaOfConcern || formData.primaryArea }
    });
  }

  return result;
};
