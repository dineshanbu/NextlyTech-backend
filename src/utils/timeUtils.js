// timeUtils.js
function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const amPm = hours < 12 ? 'AM' : 'PM';
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${amPm}`;
}

// Function to convert time string to minutes from midnight
function Batch_convertToMinutes(timeStr) {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    // Convert to 24-hour format based on AM/PM
    if (period === "PM" && hours !== 12) {
        hours += 12;
    } else if (period === "AM" && hours === 12) {
        hours = 0; // Handle midnight
    }

    return hours * 60 + minutes;
}

module.exports = { formatTime ,Batch_convertToMinutes};
