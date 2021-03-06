import {Preconditions} from '../../../Preconditions';
import {Fingerprints} from '../../../util/Fingerprints';
import {Logger} from '../../../logger/Logger';
import {FileLoader} from './FileLoader';
import {CacheRegistry} from '../../../backend/proxyserver/CacheRegistry';
import {WebResource} from '../../../electron/webresource/WebResource';
import {AppPaths} from '../../../electron/webresource/AppPaths';
import {LoadedFile} from './LoadedFile';
import {Descriptors} from '../../../viewer/html/Descriptors';
import {FilePaths} from '../../../util/FilePaths';

const log = Logger.create();

/**
 *
 */
export class PHZLoader implements FileLoader {

    private readonly cacheRegistry: CacheRegistry;

    constructor(opts: IPHZLoaderOptions) {
        this.cacheRegistry = Preconditions.assertNotNull(opts.cacheRegistry);
    }

    public async registerForLoad(path: string): Promise<LoadedFile> {

        const filename = FilePaths.basename(path);

        // FIXME: update main.js to use this loader moving forward...

        // register the phz.  the cache interceptor should do the rest.
        const cachedRequestsHolder = await this.cacheRegistry.registerFile(path);

        log.info("cachedRequestsHolder: " + JSON.stringify(cachedRequestsHolder));

        // get the cache metadata for the primary URL as it will work for the
        // subsequent URLs too.

        const cachedRequest = cachedRequestsHolder.cachedRequests[cachedRequestsHolder.metadata.url];

        log.info("Going to load URL: " + cachedRequest.url);

        const descriptor = cachedRequestsHolder.metadata;
        const descriptorJSON = JSON.stringify(descriptor);

        // we don't need the content represented twice.

        const basename = FilePaths.basename(path);

        // TODO: this is workaround until we enable zip files with embedded
        // metadata / descriptors
        const fingerprint = Fingerprints.create(basename);

        const appPath = AppPaths.relative('./htmlviewer/index.html');

        const filenameParam = encodeURIComponent(filename);

        const queryData = `?file=${encodeURIComponent(cachedRequest.url)}&fingerprint=${fingerprint}&descriptor=${encodeURIComponent(descriptorJSON)}&filename=${filenameParam}`;
        const appURL = 'file://' + appPath + queryData;

        const docDimensions = Descriptors.calculateDocDimensions(descriptor);

        return {
            webResource: WebResource.createURL(appURL),
            title: descriptor.title,
            docDimensions
        };

    }

}

export interface IPHZLoaderOptions {
    readonly cacheRegistry: CacheRegistry;
}
