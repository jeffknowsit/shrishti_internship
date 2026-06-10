A="HELLO INDIA"
z=input()
found=0
for i in A:
    if i==z.upper():
        print(i,"is found in string  ",A)
        found=1
if(found==0):
    print(z, "is not found on string" ,A)