function calculateSpawnTimes(startTime, intervalMilliseconds, count) {
    const spawnTimes = [];
    let currentTime = new Date(startTime);

    for (let i = 0; i < count; i++) {
        spawnTimes.push(new Date(currentTime));
        currentTime = new Date(currentTime.getTime() + intervalMilliseconds);
    }

    return spawnTimes;
}

function formatDate(date) {
    return date.toLocaleString();
}

function displaySpawnTimes(spawnTimes) {
    const currentTime = new Date();
    const timeList = document.getElementById('timeList');
    timeList.innerHTML = '';
    spawnTimes
        .filter(time => time > currentTime)
        .slice(0, 100)
        .forEach(time => {
            const listItem = document.createElement('li');
            listItem.textContent = formatDate(time);
            timeList.appendChild(listItem);
        });
}

function updateCurrentTime(spawnTimes) {
    const currentTimeElement = document.getElementById('currentTime');
    const nextSpawnElement = document.getElementById('nextSpawn');
    const nextSpawnTimeElement = document.getElementById('nextSpawnTime');
    const progress = document.getElementById('progress');
    const currentTime = new Date();
    const countdownCircle = document.getElementById('countdown-circle');
    const countdownText = document.getElementById('countdown-text');
    currentTimeElement.textContent = formatDate(currentTime);

    const nextSpawnTimes = spawnTimes.filter(time => time > currentTime);
    if (nextSpawnTimes.length > 0) {
        const nextSpawnTime = nextSpawnTimes[0];
        const timeDifference = nextSpawnTime - currentTime;
        const minutes = Math.floor(timeDifference / 60000);
        const seconds = Math.floor((timeDifference % 60000) / 1000);
        if (minutes <= tolerance) {
            progress.textContent = "May have started";
            countdownCircle.style.stroke = "#ff2b75"
            if (minutes === 1) {
                nextSpawnElement.textContent = `1 minute and ${seconds} seconds`;
            }
            else if (minutes === 0) {
                nextSpawnElement.textContent = `${seconds} seconds`;
            } else {
                nextSpawnElement.textContent = `${minutes} minutes and ${seconds} seconds`;
            }
        } 
        else if (minutes >= intervalMinutes - tolerance) {
            countdownCircle.style.stroke = "#fd5013"
            nextSpawnElement.textContent = `${minutes} minutes and ${seconds} seconds`;
            progress.textContent = "May have started";
        }
        else {
            countdownCircle.style.stroke = "#98e365"
            nextSpawnElement.textContent = `${minutes} minutes and ${seconds} seconds`;
            progress.textContent = "Idle";
        }
        nextSpawnTimeElement.textContent = formatDate(nextSpawnTime);
        const totalSeconds = minutes * 60 + seconds;
        const percentage = totalSeconds / (intervalMinutes * 60 + intervalSeconds);
        const offset = 283 * (1 - percentage);
        countdownCircle.style.strokeDashoffset = offset;
        countdownText.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } else {
        nextSpawnElement.textContent = 'No upcoming spawns';
        nextSpawnTimeElement.textContent = 'N/A';
        nextSpawnElement.textContent = 'No upcoming spawns';
        nextSpawnTimeElement.textContent = 'N/A';
        countdownCircle.style.strokeDashoffset = 283;
        countdownText.textContent = '0:00';
    }
}

const startTime = new Date('2024-12-07T12:09:12');
const intervalMinutes = 78;
const intervalSeconds = 52;
const tolerance = 2;
const intervalMilliseconds = (intervalMinutes * 60 + intervalSeconds) * 1000;
const spawnTimes = calculateSpawnTimes(startTime, intervalMilliseconds, 100);

displaySpawnTimes(spawnTimes);
setInterval(() => updateCurrentTime(spawnTimes), 1000);