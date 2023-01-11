import { IDigitalGardenSiteManager } from "./DigitalGardenSiteManager";
import { MetadataCache, TFile } from "obsidian";
import { IPublisher } from "./Publisher";
import { generateBlobHash, resolvePathFromFrontmatter } from "./utils";
import DigitalGardenSettings from "./DigitalGardenSettings";

export default class PublishStatusManager implements IPublishStatusManager{
    siteManager: IDigitalGardenSiteManager;
	publisher: IPublisher;
	metaDataCache: MetadataCache
	settings: DigitalGardenSettings;
    constructor(siteManager: IDigitalGardenSiteManager, publisher:IPublisher, metaDataCache: MetadataCache, settings: DigitalGardenSettings){
       this.siteManager = siteManager;
		this.publisher = publisher;
		this.metaDataCache = metaDataCache;
		this.settings = settings;
    }

    async getDeletedNotePaths(): Promise<Array<string>> {
        
        const remoteNoteHashes = await this.siteManager.getNoteHashes();
        const marked = await this.publisher.getFilesMarkedForPublishing();
        return this.generateDeletedNotePaths(remoteNoteHashes, marked);
    }

    private generateDeletedNotePaths(remoteNoteHashes: {[key:string]: string}, marked: TFile[]): Array<string> {
        const deletedNotePaths: Array<string> = [];
        Object.keys(remoteNoteHashes).forEach(key => {
			if (!marked.find(f => {
				const fileFrontMatter = { ...this.metaDataCache.getCache(f.path).frontmatter };
				const path = resolvePathFromFrontmatter(fileFrontMatter, f.path, this.settings);
				return path === key
			})) {
                if(!key.endsWith(".js")){
                    deletedNotePaths.push(key);
                }
            }
        });

        return deletedNotePaths;
    }
    async getPublishStatus(): Promise<PublishStatus> {
        const unpublishedNotes: Array<TFile> = [];
        const publishedNotes: Array<TFile> = [];
        const changedNotes: Array<TFile> = [];


        const remoteNoteHashes = await this.siteManager.getNoteHashes();
        const marked = await this.publisher.getFilesMarkedForPublishing();

        for (const file of marked) {
            const content = await this.publisher.generateMarkdown(file);

			const localHash = generateBlobHash(content);
			const fileFrontMatter = { ...this.metaDataCache.getCache(file.path).frontmatter };
			const path = resolvePathFromFrontmatter(fileFrontMatter, file.path, this.settings);
            const remoteHash = remoteNoteHashes[path];
            if (!remoteHash) {
                unpublishedNotes.push(file);
            }
            else if (remoteHash === localHash) {
                publishedNotes.push(file);
            }
            else {
                changedNotes.push(file);
            }
        }

        const deletedNotePaths = this.generateDeletedNotePaths(remoteNoteHashes, marked);

        unpublishedNotes.sort((a, b) => a.path > b.path ? 1 : -1);
        publishedNotes.sort((a, b) => a.path > b.path ? 1 : -1);
        changedNotes.sort((a, b) => a.path > b.path ? 1 : -1);
        deletedNotePaths.sort((a, b) => a > b ? 1 : -1);
        return { unpublishedNotes, publishedNotes, changedNotes, deletedNotePaths };
    }
}

export interface PublishStatus{
    unpublishedNotes: Array<TFile>;
    publishedNotes: Array<TFile>;
    changedNotes: Array<TFile>;
    deletedNotePaths: Array<string>;
}

export interface IPublishStatusManager{
    getPublishStatus(): Promise<PublishStatus>; 
    getDeletedNotePaths(): Promise<Array<string>>;
}
