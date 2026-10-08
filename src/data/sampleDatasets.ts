import { FileMetadata } from '../engine/types';
import { BYTE_UNITS } from '../engine/normalizer';
import { detectCategory, suggestPriority } from '../engine/priority';

function createSampleFile(
  name: string,
  path: string,
  sizeBytes: number,
  daysAgo: number,
  manualPriority?: number
): FileMetadata {
  const lastModified = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  const category = detectCategory(name);
  const { priority } = suggestPriority(category, lastModified);

  return {
    id: `sample-${name.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name,
    path,
    size: sizeBytes,
    type: name.split('.').pop() || 'bin',
    lastModified,
    category,
    priority: manualPriority ?? priority,
    prioritySource: manualPriority ? 'edited' : 'auto',
    isPinned: false,
    isExcluded: false,
  };
}

export const STUDENT_LAPTOP_DATASET: FileMetadata[] = [
  createSampleFile('Algorithms_Final_Report.pdf', '/Documents/School/Algorithms_Final_Report.pdf', 8.4 * BYTE_UNITS.MB, 5, 10),
  createSampleFile('Machine_Learning_Thesis.docx', '/Documents/School/Machine_Learning_Thesis.docx', 18.2 * BYTE_UNITS.MB, 10, 9),
  createSampleFile('Compiler_Project_Repo.zip', '/Code/Compiler_Project_Repo.zip', 320 * BYTE_UNITS.MB, 12, 9),
  createSampleFile('Ubuntu_24_04_LTS.iso', '/Downloads/Ubuntu_24_04_LTS.iso', 4.8 * BYTE_UNITS.GB, 20, 4),
  createSampleFile('WebDev_Node_Modules_Backup.tar.gz', '/Code/Backups/WebDev_Node_Modules_Backup.tar.gz', 1.2 * BYTE_UNITS.GB, 25, 3),
  createSampleFile('Class_Lecture_Week10.mp4', '/Videos/Lectures/Class_Lecture_Week10.mp4', 1.8 * BYTE_UNITS.GB, 8, 7),
  createSampleFile('Class_Lecture_Week09.mp4', '/Videos/Lectures/Class_Lecture_Week09.mp4', 1.6 * BYTE_UNITS.GB, 15, 6),
  createSampleFile('Campus_Festival_Photos.zip', '/Photos/Campus_Festival_Photos.zip', 2.1 * BYTE_UNITS.GB, 30, 5),
  createSampleFile('Spotify_Offline_Cache.dat', '/AppData/Spotify/Spotify_Offline_Cache.dat', 3.4 * BYTE_UNITS.GB, 2, 2),
  createSampleFile('Project_Proposal.pdf', '/Documents/Work/Project_Proposal.pdf', 14 * BYTE_UNITS.MB, 14, 9),
  createSampleFile('Expense_Report_Q3.docx', '/Documents/Finance/Expense_Report_Q3.docx', 15 * BYTE_UNITS.MB, 5, 8),
  createSampleFile('System_Config_Backup.bin', '/Backups/System/System_Config_Backup.bin', 75 * BYTE_UNITS.MB, 20, 5),
];

export const PHOTOGRAPHER_DATASET: FileMetadata[] = [
  // Commercial project shoot
  createSampleFile('Vogue_Shoot_001.CR2', '/Client_Shoots/Vogue/RAW/Vogue_Shoot_001.CR2', 45 * BYTE_UNITS.MB, 4),
  createSampleFile('Vogue_Shoot_002.CR2', '/Client_Shoots/Vogue/RAW/Vogue_Shoot_002.CR2', 48 * BYTE_UNITS.MB, 4),
  createSampleFile('Vogue_Shoot_003.CR2', '/Client_Shoots/Vogue/RAW/Vogue_Shoot_003.CR2', 46 * BYTE_UNITS.MB, 4),
  createSampleFile('Vogue_Shoot_004.CR2', '/Client_Shoots/Vogue/RAW/Vogue_Shoot_004.CR2', 50 * BYTE_UNITS.MB, 4),
  createSampleFile('Vogue_Master_Retouch.psd', '/Client_Shoots/Vogue/Exports/Vogue_Master_Retouch.psd', 1.8 * BYTE_UNITS.GB, 2, 10),
  createSampleFile('Vogue_Editorial_Final.jpg', '/Client_Shoots/Vogue/Exports/Vogue_Editorial_Final.jpg', 24 * BYTE_UNITS.MB, 2, 9),

  // Wedding shoot
  createSampleFile('Wedding_Highlights_4K.mov', '/Weddings/Miller/Video/Wedding_Highlights_4K.mov', 14.5 * BYTE_UNITS.GB, 10, 8),
  createSampleFile('Wedding_Ceremony_RAW.mp4', '/Weddings/Miller/Video/Wedding_Ceremony_RAW.mp4', 28.0 * BYTE_UNITS.GB, 12, 6),
  createSampleFile('Wedding_Audio_Multitrack.wav', '/Weddings/Miller/Audio/Wedding_Audio_Multitrack.wav', 1.4 * BYTE_UNITS.GB, 12, 7),
  createSampleFile('Wedding_Album_Print_Ready.pdf', '/Weddings/Miller/Deliverables/Wedding_Album_Print_Ready.pdf', 380 * BYTE_UNITS.MB, 8, 9),

  // Landscape Portfolio
  createSampleFile('Patagonia_Glacier_Sunrise.DNG', '/Portfolio/Landscape/Patagonia_Glacier_Sunrise.DNG', 92 * BYTE_UNITS.MB, 400, 7),
  createSampleFile('Dolomites_Peak_Panorama.tiff', '/Portfolio/Landscape/Dolomites_Peak_Panorama.tiff', 450 * BYTE_UNITS.MB, 500, 7),
  createSampleFile('Iceland_Northern_Lights.RAW', '/Portfolio/Landscape/Iceland_Northern_Lights.RAW', 85 * BYTE_UNITS.MB, 650, 7),
  createSampleFile('Portfolio_Site_Assets.zip', '/Portfolio/Web/Portfolio_Site_Assets.zip', 750 * BYTE_UNITS.MB, 60, 6),

  // Drone Footage
  createSampleFile('Coastline_Drone_Take1.mp4', '/Stock_Footage/Drone/Coastline_Drone_Take1.mp4', 6.2 * BYTE_UNITS.GB, 25, 6),
  createSampleFile('Coastline_Drone_Take2.mp4', '/Stock_Footage/Drone/Coastline_Drone_Take2.mp4', 5.8 * BYTE_UNITS.GB, 25, 6),
  createSampleFile('Alpine_Forest_Fog.mp4', '/Stock_Footage/Drone/Alpine_Forest_Fog.mp4', 8.1 * BYTE_UNITS.GB, 80, 5),

  // Lightroom Catalog & Caches
  createSampleFile('Master_Lightroom_Catalog.lrcat', '/Lightroom/Master_Lightroom_Catalog.lrcat', 4.5 * BYTE_UNITS.GB, 1, 9),
  createSampleFile('Lightroom_Smart_Previews.lrdata', '/Lightroom/Lightroom_Smart_Previews.lrdata', 12.0 * BYTE_UNITS.GB, 1, 3),
  createSampleFile('Camera_Raw_Cache.tmp', '/Cache/Camera_Raw_Cache.tmp', 8.5 * BYTE_UNITS.GB, 1, 2),

  // Soundtracks & SFX
  createSampleFile('Cinematic_Epic_Strings.wav', '/Audio/SFX/Cinematic_Epic_Strings.wav', 65 * BYTE_UNITS.MB, 150, 5),
  createSampleFile('Ambient_Wind_Chimes.flac', '/Audio/SFX/Ambient_Wind_Chimes.flac', 42 * BYTE_UNITS.MB, 200, 4),
  createSampleFile('Podcast_Interview_Episode04.wav', '/Audio/Podcasts/Podcast_Interview_Episode04.wav', 820 * BYTE_UNITS.MB, 14, 7),

  // Archive & Outtakes
  createSampleFile('Discarded_Outtakes_2024.zip', '/Archives/Discarded_Outtakes_2024.zip', 35.0 * BYTE_UNITS.GB, 400, 2),
  createSampleFile('Expired_Client_Proofs.tar', '/Archives/Expired_Client_Proofs.tar', 18.0 * BYTE_UNITS.GB, 600, 2),

  // More RAW batch files to reach 40 files
  ...Array.from({ length: 15 }, (_, i) =>
    createSampleFile(
      `Tokyo_Street_Batch_${String(i + 1).padStart(3, '0')}.ARW`,
      `/Travel/Tokyo/RAW/Tokyo_Street_Batch_${String(i + 1).padStart(3, '0')}.ARW`,
      (38 + (i % 7)) * BYTE_UNITS.MB,
      45 + i * 2,
      6
    )
  ),
];

export const COMPANY_SERVER_DATASET: FileMetadata[] = [
  // Database backups
  createSampleFile('production_postgres_dump_2026_09_28.sql.gz', '/Backups/PostgreSQL/production_postgres_dump_2026_09_28.sql.gz', 14.8 * BYTE_UNITS.GB, 1, 10),
  createSampleFile('production_postgres_dump_2026_09_21.sql.gz', '/Backups/PostgreSQL/production_postgres_dump_2026_09_21.sql.gz', 14.5 * BYTE_UNITS.GB, 8, 8),
  createSampleFile('staging_db_clone.sql', '/Backups/PostgreSQL/staging_db_clone.sql', 8.2 * BYTE_UNITS.GB, 30, 6),
  createSampleFile('analytics_clickhouse_backup.tar', '/Backups/ClickHouse/analytics_clickhouse_backup.tar', 42.0 * BYTE_UNITS.GB, 14, 7),
  createSampleFile('customer_crm_sqlite.db', '/Backups/CRM/customer_crm_sqlite.db', 1.8 * BYTE_UNITS.GB, 2, 9),

  // System & VM Images
  createSampleFile('k8s_worker_node_image.qcow2', '/VirtualMachines/k8s_worker_node_image.qcow2', 22.5 * BYTE_UNITS.GB, 90, 5),
  createSampleFile('legacy_windows_server_vm.vmdk', '/VirtualMachines/legacy_windows_server_vm.vmdk', 68.0 * BYTE_UNITS.GB, 450, 4),
  createSampleFile('ci_docker_builder_cache.tar', '/Docker/ci_docker_builder_cache.tar', 34.0 * BYTE_UNITS.GB, 3, 3),

  // Audit, Security & Financials
  createSampleFile('Q3_2026_Financial_Audit.xlsx', '/Corporate/Finance/Q3_2026_Financial_Audit.xlsx', 14.2 * BYTE_UNITS.MB, 5, 10),
  createSampleFile('SOC2_Compliance_Evidence_Bundle.zip', '/Security/SOC2_Compliance_Evidence_Bundle.zip', 3.2 * BYTE_UNITS.GB, 12, 10),
  createSampleFile('Employee_Contracts_Encrypted.tar.enc', '/Corporate/Legal/Employee_Contracts_Encrypted.tar.enc', 850 * BYTE_UNITS.MB, 20, 10),
  createSampleFile('SSL_Certs_And_Keys_Vault.tar.gz', '/Security/SSL_Certs_And_Keys_Vault.tar.gz', 4.5 * BYTE_UNITS.MB, 40, 10),

  // Logs & Debug dumps
  createSampleFile('nginx_access_log_august_2026.log', '/Logs/Nginx/nginx_access_log_august_2026.log', 19.5 * BYTE_UNITS.GB, 35, 2),
  createSampleFile('nginx_access_log_september_2026.log', '/Logs/Nginx/nginx_access_log_september_2026.log', 24.2 * BYTE_UNITS.GB, 2, 3),
  createSampleFile('api_gateway_error_traces.log', '/Logs/Gateway/api_gateway_error_traces.log', 7.4 * BYTE_UNITS.GB, 1, 3),
  createSampleFile('core_memory_dump_crash_2026_08.dmp', '/Crashes/core_memory_dump_crash_2026_08.dmp', 16.0 * BYTE_UNITS.GB, 50, 2),

  // Git repositories & Releases
  createSampleFile('monorepo_mirror_bundle.bundle', '/Git/monorepo_mirror_bundle.bundle', 5.6 * BYTE_UNITS.GB, 3, 9),
  createSampleFile('release_v4_2_0_linux_x86_64.tar.gz', '/Releases/release_v4_2_0_linux_x86_64.tar.gz', 420 * BYTE_UNITS.MB, 15, 8),
  createSampleFile('release_v4_1_9_linux_x86_64.tar.gz', '/Releases/release_v4_1_9_linux_x86_64.tar.gz', 415 * BYTE_UNITS.MB, 45, 6),
  createSampleFile('release_v4_0_0_legacy.tar.gz', '/Releases/release_v4_0_0_legacy.tar.gz', 390 * BYTE_UNITS.MB, 180, 5),

  // Additional realistic server entries to make 60 files
  ...Array.from({ length: 40 }, (_, i) => {
    const isOld = i > 25;
    const cat = i % 3 === 0 ? 'Logs' : i % 3 === 1 ? 'Backups' : 'Documents';
    const ext = i % 3 === 0 ? 'log' : i % 3 === 1 ? 'sql.gz' : 'pdf';
    return createSampleFile(
      `department_archive_shard_${String(i + 1).padStart(2, '0')}.${ext}`,
      `/${cat}/Shards/department_archive_shard_${String(i + 1).padStart(2, '0')}.${ext}`,
      (0.8 + (i % 6) * 1.5) * BYTE_UNITS.GB,
      isOld ? 800 + i * 10 : 10 + i * 5,
      isOld ? 2 : 5 + (i % 5)
    );
  }),
];
