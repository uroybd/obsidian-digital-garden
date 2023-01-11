import { Base64 } from "js-base64";
import slugify from "@sindresorhus/slugify";
import sha1 from "crypto-js/sha1";

function arrayBufferToBase64(buffer: ArrayBuffer) {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return Base64.btoa(binary);
}

function extractBaseUrl(url: string) {
	return url && url.replace("https://", "").replace("http://", "").replace(/\/$/, '')
}

function generateUrlPath(filePath: string, slugifyPath = true): string {
	if(!filePath){
		return filePath;
	}
	const extensionLessPath = filePath.substring(0, filePath.lastIndexOf("."));

	if(!slugifyPath){
		return extensionLessPath  + "/";
	}

	return extensionLessPath.split("/").map(x => slugify(x)).join("/") + "/";
}

function generateBlobHash(content: string){
	const byteLength = (new TextEncoder().encode(content)).byteLength;
	const header = `blob ${byteLength}\0`;
	const gitBlob = header + content;

	return sha1(gitBlob).toString();
}

function kebabize(str: string){ 
	return str.split('').map((letter, idx) => {
	  return letter.toUpperCase() === letter
	   ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
	   : letter;
	}).join('');
}
 
function resolvePathFromFrontmatter(frontmatter: any, filePath: string, settings: any) {
	if (frontmatter && frontmatter["dg-path"]) {
		const file_name_parts = filePath.split("/");
		filePath = frontmatter["dg-path"] + frontmatter["dg-path"][frontmatter["dg-path"].length - 1] == "/" ? '' : "/" + file_name_parts[file_name_parts.length - 1];
		} else {
			const rules = settings.pathRewriteRules.split('\n');
			for (let i = 0; i < rules.length; i++) {
				const parts = rules[i].split(":");
				if (filePath.startsWith(parts[0])) {
					filePath = filePath.replace(parts[0], parts[1]);
					break;
				}
			}
		}
		return filePath;
	}

export { arrayBufferToBase64, extractBaseUrl, generateUrlPath, generateBlobHash, kebabize, resolvePathFromFrontmatter};
