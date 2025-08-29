import { NextResponse } from 'next/server'
import { HealthChecker } from '@/lib/monitoring'
import config from '@/lib/config'

export async function GET() {
  try {
    const healthStatus = await HealthChecker.checkHealth()
    
    // Include basic system info
    const systemInfo = {
      environment: config.isProduction ? 'production' : 'development',
      platform: config.deployment.platform,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
    }

    return NextResponse.json({
      ...healthStatus,
      system: systemInfo,
    }, {
      status: healthStatus.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  }
}