import cs2inspect # type: ignore

def link(defindex, paintindex, paintseed, paintwear, rarity):
    proto_base = cs2inspect.Builder(
    defindex,
    paintindex,
    paintseed,
    paintwear,
    rarity,
    )
    
    # proto_base.stickers.append({'slot': 2, 'sticker_id': 7203, 'wear': 0})

    try:
        protobuf = proto_base.build()
    except Exception as e:
        print(f"Build failed: {e}")
        exit(1)
        
    link_str = cs2inspect.link(protobuf)
    
    return link_str