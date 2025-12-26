let totalVisits = 0;
let monthlyVisits = 0;
let chartDrawn = false;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupCanvas();
});

function setupCanvas() {
    const canvas = document.getElementById("visitsChart");
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    
    // Set canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

async function loadStats() {
    try {
        // Show loading state
        const totalEl = document.getElementById("total");
        const monthlyEl = document.getElementById("monthly");
        if (totalEl) totalEl.innerText = "...";
        if (monthlyEl) monthlyEl.innerText = "...";
        
        // Fetch both stats in parallel
        const [totalRes, monthlyRes] = await Promise.all([
            fetch(`${BACKEND_URL}/stats/total`),
            fetch(`${BACKEND_URL}/stats/monthly`)
        ]);

        if (!totalRes.ok || !monthlyRes.ok) {
            throw new Error('Failed to fetch stats');
        }

        const totalData = await totalRes.json();
        const monthlyData = await monthlyRes.json();

        totalVisits = totalData.total;
        monthlyVisits = monthlyData.monthly;

        // Update DOM
        if (totalEl) totalEl.innerText = totalVisits.toLocaleString();
        if (monthlyEl) monthlyEl.innerText = monthlyVisits.toLocaleString();

        // Draw chart
        drawChart();
    } catch (error) {
        console.error('Error loading stats:', error);
        const totalEl = document.getElementById("total");
        const monthlyEl = document.getElementById("monthly");
        if (totalEl) totalEl.innerText = "Error";
        if (monthlyEl) monthlyEl.innerText = "Error";
        drawErrorChart();
    }
}

function drawChart() {
    if (chartDrawn) return;
    
    const canvas = document.getElementById("visitsChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart configuration
    const chartPadding = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = canvas.width - chartPadding.left - chartPadding.right;
    const chartHeight = canvas.height - chartPadding.top - chartPadding.bottom;
    
    // Find max value for scaling
    const maxValue = Math.max(totalVisits, monthlyVisits);
    const scaleFactor = maxValue > 0 ? chartHeight / maxValue : 1;
    
    // Bar dimensions
    const barWidth = Math.min(80, chartWidth / 3);
    const barSpacing = (chartWidth - (2 * barWidth)) / 3;
    
    // Calculate bar positions
    const totalBarHeight = totalVisits * scaleFactor;
    const monthlyBarHeight = monthlyVisits * scaleFactor;
    
    // Draw bars with gradient
    const totalGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    totalGradient.addColorStop(0, '#4A90E2');
    totalGradient.addColorStop(1, '#2C6CB0');
    
    const monthlyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    monthlyGradient.addColorStop(0, '#50E3C2');
    monthlyGradient.addColorStop(1, '#3ABBA0');
    
    // Draw total bar
    ctx.fillStyle = totalGradient;
    ctx.fillRect(
        chartPadding.left + barSpacing,
        chartPadding.top + (chartHeight - totalBarHeight),
        barWidth,
        totalBarHeight
    );
    
    // Draw total bar shadow
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    
    // Draw monthly bar
    ctx.fillStyle = monthlyGradient;
    ctx.fillRect(
        chartPadding.left + barSpacing * 2 + barWidth,
        chartPadding.top + (chartHeight - monthlyBarHeight),
        barWidth,
        monthlyBarHeight
    );
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw bar labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    
    // Total label
    ctx.fillText(
        'Total',
        chartPadding.left + barSpacing + (barWidth / 2),
        chartPadding.top + chartHeight + 30
    );
    
    // Monthly label
    ctx.fillText(
        'Monthly',
        chartPadding.left + barSpacing * 2 + barWidth + (barWidth / 2),
        chartPadding.top + chartHeight + 30
    );
    
    // Draw values on top of bars
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    
    // Total value
    ctx.fillText(
        totalVisits.toLocaleString(),
        chartPadding.left + barSpacing + (barWidth / 2),
        chartPadding.top + (chartHeight - totalBarHeight) - 10
    );
    
    // Monthly value
    ctx.fillText(
        monthlyVisits.toLocaleString(),
        chartPadding.left + barSpacing * 2 + barWidth + (barWidth / 2),
        chartPadding.top + (chartHeight - monthlyBarHeight) - 10
    );
    
    // Draw Y-axis labels
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    
    // Draw grid lines and labels
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = chartPadding.top + chartHeight - (i * (chartHeight / gridLines));
        const value = Math.round((i * maxValue) / gridLines);
        
        // Draw grid line
        ctx.strokeStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.moveTo(chartPadding.left, y);
        ctx.lineTo(chartPadding.left + chartWidth, y);
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#666';
        ctx.fillText(
            value.toLocaleString(),
            chartPadding.left - 10,
            y + 4
        );
    }
    
    chartDrawn = true;
}

function drawErrorChart() {
    const canvas = document.getElementById("visitsChart");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw error message
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        'Failed to load chart data',
        canvas.width / 2,
        canvas.height / 2
    );
}

// Handle window resize
window.addEventListener('resize', function() {
    setupCanvas();
    if (totalVisits > 0 || monthlyVisits > 0) {
        chartDrawn = false;
        drawChart();
    }
});