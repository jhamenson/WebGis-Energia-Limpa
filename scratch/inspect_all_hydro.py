import os
import glob
import pyogrio

print("=== Arquivos em ANA_massa_dagua_v2019 ===")
for f in glob.glob(r"C:\QGIS_camadas\Camadas\Vetores\ANA_massa_dagua_v2019\*.shp"):
    print(" -", f)
    info = pyogrio.read_info(f)
    print("   Fields:", info['fields'])
    print("   Count:", info['features'])

print("\n=== Arquivos em bc_250_shapefiles_2026_03_03 (hidrografia) ===")
for f in glob.glob(r"C:\QGIS_camadas\Camadas\Vetores\bc_250_shapefiles_2026_03_03\**\*.shp", recursive=True):
    if "hid" in f.lower() or "rio" in f.lower() or "massa" in f.lower() or "curso" in f.lower() or "trecho" in f.lower():
        print(" -", f)
        info = pyogrio.read_info(f)
        print("   Fields:", info['fields'][:8])
        print("   Count:", info['features'])
