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
    timeList.innerHTML = ''; // 清空之前的列表
    spawnTimes
        .filter(time => time > currentTime) // 过滤掉当前时间之前的生成时间
        .slice(0, 10) // 只显示后10个生成时间
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
    currentTimeElement.textContent = formatDate(currentTime);

    const nextSpawnTimes = spawnTimes.filter(time => time > currentTime);
    if (nextSpawnTimes.length > 0) {
        const nextSpawnTime = nextSpawnTimes[0];
        const timeDifference = nextSpawnTime - currentTime;
        const minutes = Math.floor(timeDifference / 60000);
        const seconds = Math.floor((timeDifference % 60000) / 1000);
        if (minutes <= tolerance) {
            progress.textContent = "May have started";
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
            nextSpawnElement.textContent = `${minutes} minutes and ${seconds} seconds`;
            progress.textContent = "May have started";
        }
        else {
            nextSpawnElement.textContent = `${minutes} minutes and ${seconds} seconds`;
            progress.textContent = "Idle";
        }
        nextSpawnTimeElement.textContent = formatDate(nextSpawnTime);
    } else {
        nextSpawnElement.textContent = 'No upcoming spawns';
        nextSpawnTimeElement.textContent = 'N/A';
    }
}

const startTime = new Date('2024-12-07T12:09:12');
const intervalMinutes = 78;
const intervalSeconds = 52;
const tolerance = 2;
const intervalMilliseconds = (intervalMinutes * 60 + intervalSeconds) * 1000;
const spawnTimes = calculateSpawnTimes(startTime, intervalMilliseconds, 100); // 计算足够多的生成时间

displaySpawnTimes(spawnTimes);
setInterval(() => updateCurrentTime(spawnTimes), 1000);