import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl } = await req.json();
    
    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY is not configured');
    }

    if (!linkedinUrl) {
      throw new Error('LinkedIn URL is required');
    }

    console.log('Scraping LinkedIn profile:', linkedinUrl);

    // Use the new LinkedIn Profile Scraper actor (2SyF0bVxmgGr8IVCZ)
    const actorId = '2SyF0bVxmgGr8IVCZ';
    
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrls: [linkedinUrl],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apify API error:', response.status, errorText);
      throw new Error(`Apify API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Apify scrape completed, items:', data.length);

    if (!data || data.length === 0) {
      throw new Error('No profile data returned from Apify');
    }

    const profile = data[0];
    
    // Extract and normalize the comprehensive profile data
    const linkedinProfile = {
      // Basic info
      fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      headline: profile.headline || '',
      summary: profile.summary || profile.about || '',
      
      // Contact info
      email: profile.email || null,
      mobileNumber: profile.mobileNumber || null,
      
      // Current job
      jobTitle: profile.jobTitle || profile.headline || '',
      companyName: profile.companyName || '',
      companyIndustry: profile.companyIndustry || '',
      companySize: profile.companySize || '',
      companyWebsite: profile.companyWebsite || '',
      companyLinkedin: profile.companyLinkedin || '',
      jobLocation: profile.jobLocation || '',
      jobStartedOn: profile.jobStartedOn || '',
      currentJobDuration: profile.currentJobDuration || '',
      
      // Profile stats
      connections: profile.connections || 0,
      followers: profile.followers || 0,
      
      // Full experience history
      experiences: (profile.experiences || []).map((exp: any) => ({
        title: exp.title || '',
        companyName: exp.companyName || '',
        description: exp.jobDescription || exp.description || '',
        location: exp.jobLocation || exp.location || '',
        startDate: exp.jobStartedOn || exp.startDate || '',
        endDate: exp.jobEndedOn || exp.endDate || null,
        stillWorking: exp.jobStillWorking || false,
        duration: exp.duration || '',
        companyIndustry: exp.companyIndustry || '',
        companySize: exp.companySize || '',
      })),
      
      // Education
      educations: (profile.educations || []).map((edu: any) => ({
        schoolName: edu.schoolName || edu.school || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || edu.field || '',
        startYear: edu.startYear || '',
        endYear: edu.endYear || '',
        description: edu.description || '',
      })),
      
      // Skills
      skills: (profile.skills || []).map((skill: any) => ({
        title: typeof skill === 'string' ? skill : (skill.title || skill.name || ''),
      })),
      
      // Languages
      languages: (profile.languages || []).map((lang: any) => ({
        name: typeof lang === 'string' ? lang : (lang.name || ''),
        proficiency: typeof lang === 'object' ? lang.proficiency : '',
      })),
      
      // Certifications
      certifications: (profile.certifications || []).map((cert: any) => ({
        name: cert.name || cert.title || '',
        authority: cert.authority || cert.organization || '',
        issueDate: cert.issueDate || '',
      })),
      
      // Profile URL and identifiers
      linkedinUrl: profile.linkedinUrl || profile.linkedinPublicUrl || linkedinUrl,
      publicIdentifier: profile.publicIdentifier || '',
      profilePicture: profile.profilePicture || profile.profilePictureUrl || '',
      
      // Raw data for reference
      _raw: profile,
    };

    console.log('Profile extracted:', linkedinProfile.fullName, '- Skills:', linkedinProfile.skills.length, '- Experiences:', linkedinProfile.experiences.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: linkedinProfile,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in apify-scrape:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
