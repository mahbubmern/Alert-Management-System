// Function to convert ISO date to local DD/MM/YYYY format
export const generateUniqueAlertId = (lastSerial = 0) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');

  const serialNumber = String(lastSerial + 1).padStart(7, '0'); // 7-digit serial

  return `ALERT-${year}${month}${date}-${serialNumber}`;
};

export const generateDateTime = () => {
  const now = new Date();

  const day = now.getDate();
  const month = now.getMonth() + 1; // Months are zero-based
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 -> 12 for 12 AM

  return `${day}-${month}-${year} ${hours}.${minutes} ${ampm}`;
};






  
