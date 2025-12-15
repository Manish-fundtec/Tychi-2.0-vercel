import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })

    // Expire cookies by setting them with past expiration date
    response.cookies.set('dashboardToken', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 0, // Expire immediately
      expires: new Date(0) // Set to epoch time (Jan 1, 1970)
    })

    response.cookies.set('userToken', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 0, // Expire immediately
      expires: new Date(0) // Set to epoch time (Jan 1, 1970)
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    )
  }
}

