import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  name: { type: String },
  position: { type: String },
});

const SocialMediaLinksSchema = new mongoose.Schema({
  facebook: { type: String },
  instagram: { type: String },
  youtube: { type: String },
  xing: { type: String },
  linkedin: { type: String },
  twitter: { type: String },
  pinterest: { type: String }
});

const InstagramFollowersSchema = new mongoose.Schema({
  followersCount: { type: Number },
  followingCount: { type: Number },
  postsCount: { type: Number },
});

const LinkedinDataSchema = new mongoose.Schema({
  companyName: { type: String },
  industry: { type: String },
  size: { type: String },
  headquarters: { type: String },
  organizationType: { type: String },
  foundedOn: { type: String },
  specialties: { type: String },
  employees: [EmployeeSchema],
});

const ImprintDetailsSchema = new mongoose.Schema({
  emails: [String],
  phones: [String],
  jobTitlesWithNames: [
    {
      jobTitle: { type: String },
      name: { type: String },
    },
  ],
});

const GoogleAdTransparencySchema = new mongoose.Schema({
  domain: { type: String },
  advertiserName: { type: String },
  firstShown: { type: String },
  lastShown: { type: String },
  topic: { type: String },
});

const MetaAdLibrarySchema = new mongoose.Schema({
  facebookUrl: { type: String },
  pageId: { type: String },
  adLibraryData: {
    pageId: { type: String },
    adLibraryUrl: { type: String },
    adStatus: { type: String },
    startedRunningText: { type: String },
  },
});

const PageSpeedSchema = new mongoose.Schema({
  performanceScore: { type: Number },
  firstContentfulPaint: { type: String },
  speedIndex: { type: String },
  timeToInteractive: { type: String },
  mobileFriendly: { type: String },
  performanceDescription: { type: String },
});

const PageSpeedDataSchema = new mongoose.Schema({
  mobile: PageSpeedSchema,
  desktop: PageSpeedSchema,
});

const GoogleSearchSchema = new mongoose.Schema({
  googleRank: { type: Number, default: null },
  matchingUrls: [String],
});

const LibraryFileSchema = new mongoose.Schema({
  library: { type: String },
  count: { type: Number },
  files: [String],
});


const SEOInfoSchema = new mongoose.Schema({
  titleTag: {
    exists: { type: Boolean },
    content: { type: String },
    isValidLength: { type: Boolean },
    description: { type: String },
  },
  metaDescription: {
    exists: { type: Boolean },
    content: { type: String },
    isValidLength: { type: Boolean },
    description: { type: String },
  },
  headerTags: {
    isValidSequence: { type: Boolean },
    multipleH1: { type: Boolean },
    description: { type: String },
  },
  imageAltText: {
    totalImages: { type: Number },
    totalMissingAlt: { type: Number },
    altMissing: { type: Boolean },
    description: { type: String },
  },
  schemaMarkup: {
    exists: { type: Boolean },
    description: { type: String },
  },
  robotsMetaTag: {
    exists: { type: Boolean },
    description: { type: String },
  },
  hreflangTags: {
    countries: [String],
    description: { type: String },
  },
  openGraphTags: {
    missingTags: [String],
    description: { type: String },
  },
  canonicalTag: {
    exists: { type: Boolean },
    href: { type: String },
    description: { type: String },
  },
  favicon: {
    exists: { type: Boolean },
    href: { type: String },
    description: { type: String },
  },
  viewportMetaTag: {
    exists: { type: Boolean },
    content: { type: String },
    description: { type: String },
  },
  brokenLinks: {
    brokenLinkCount: { type: Number },
    description: { type: String },
  },
  textToHtmlRatio: {
    ratio: { type: String },
    isWithinBestPractices: { type: Boolean },
    description: { type: String },
  },
  missingOrEmptyLinks: {
    missingLinkCount: { type: Number },
    description: { type: String },
  },
  commonLibraryFiles: {
    detectedLibraries: [LibraryFileSchema],
    description: { type: String },
  },
});

const expiredDate = new mongoose.Schema({
  websiteScrapingDate: { type: Date },
  facebookScrapingDate: { type: Date },
  linkedinScrapingDate: { type: Date },
  pageSppedDate: { type: Date },
  googleScrapingDate: { type: Date },
  googleAdLibraryScrapingDate: { type: Date }
})

const LeadSchema = new mongoose.Schema(
  {
    closeId: { type: String },
    name: { type: String, required: true },
    url: { type: String },
    socialMediaLinks: SocialMediaLinksSchema,
    facebookFollowers: { type: String },
    instagramFollowers: InstagramFollowersSchema,
    linkedinData: LinkedinDataSchema,
    imprintDetails: ImprintDetailsSchema,
    googleAdTransparency: GoogleAdTransparencySchema,
    metaAdLibrary: MetaAdLibrarySchema,
    pageSpeed: PageSpeedDataSchema,
    googleSearch: GoogleSearchSchema,
    seoInfo: SEOInfoSchema,
    expireScrapingDate: expiredDate,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);


const Lead = mongoose.model('Lead', LeadSchema);

export default Lead
