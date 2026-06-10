n=input()
z=list(new_dict.keys())
print(z)
for i in z:
    if i==n:
        found=1
        print("found key ", n)
        exit()
if found==0:
    print("key",n,"not found")